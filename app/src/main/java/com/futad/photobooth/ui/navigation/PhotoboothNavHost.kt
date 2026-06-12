package com.futad.photobooth.ui.navigation

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.futad.photobooth.di.PhotoboothEntryPoint
import com.futad.photobooth.feature.admin.AdminScreen
import com.futad.photobooth.feature.admin.DeviceStatusProvider
import com.futad.photobooth.feature.admin.PairingScreen
import com.futad.photobooth.feature.admin.SetPinScreen
import com.futad.photobooth.feature.admin.demoWeddingEvent
import com.futad.photobooth.feature.attract.AttractScreen
import com.futad.photobooth.feature.capture.CaptureScreen
import com.futad.photobooth.feature.consent.ConsentScreen
import com.futad.photobooth.feature.consent.ConsentViewModel
import com.futad.photobooth.feature.sharing.ShareScreen
import com.futad.photobooth.ui.AppShellViewModel
import com.futad.photobooth.ui.MainViewModel
import dagger.hilt.android.EntryPointAccessors
import kotlinx.coroutines.launch
import java.io.File

object Routes {
    const val PAIRING = "pairing"
    const val ATTRACT = "attract"
    const val CONSENT = "consent"
    const val CAPTURE = "capture"
    const val SHARE = "share"
    const val ADMIN = "admin"
}

@Composable
fun PhotoboothNavHost(
    mainViewModel: MainViewModel = hiltViewModel(),
    shellViewModel: AppShellViewModel = hiltViewModel(),
) {
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val isPaired by shellViewModel.isPaired.collectAsStateWithLifecycle()
    val activeEvent by mainViewModel.activeEvent.collectAsStateWithLifecycle()
    var currentMediaPath by remember { mutableStateOf<String?>(null) }
    var currentCaptureId by remember { mutableStateOf<String?>(null) }
    val entryPoint = EntryPointAccessors.fromApplication(context, PhotoboothEntryPoint::class.java)
    val adminUnlockManager = entryPoint.adminUnlockManager()
    val qrGenerator = entryPoint.qrCodeGenerator()
    val pinManager = entryPoint.pinManager()
    val credentialsStore = entryPoint.deviceCredentialsStore()
    val syncScheduler = entryPoint.syncScheduler()

    val startDestination = if (isPaired) Routes.ATTRACT else Routes.PAIRING
    val reduceMotion = false
    var companionHostIp by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        companionHostIp = credentialsStore.getCompanionHostIp().orEmpty()
    }

    LaunchedEffect(isPaired, activeEvent?.eventId) {
        if (isPaired && activeEvent == null) {
            mainViewModel.ensureActiveEvent()
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        enterTransition = {
            if (reduceMotion) EnterTransition.None
            else fadeIn(tween(300)) + slideInVertically(tween(300)) { it / 8 }
        },
        exitTransition = {
            if (reduceMotion) ExitTransition.None
            else fadeOut(tween(200))
        },
    ) {
        composable(Routes.PAIRING) {
            PairingScreen(
                onPaired = {
                    navController.navigate(Routes.ATTRACT) {
                        popUpTo(Routes.PAIRING) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.ATTRACT) {
            AttractScreen(
                config = activeEvent?.config,
                eventName = activeEvent?.eventName,
                onStart = { navController.navigate(Routes.CONSENT) },
                onAdminAccess = { navController.navigate(Routes.ADMIN) },
            )
        }
        composable(Routes.CONSENT) {
            val consentViewModel: ConsentViewModel = hiltViewModel()
            val consentState by consentViewModel.uiState.collectAsStateWithLifecycle()
            LaunchedEffect(Unit) {
                mainViewModel.ensureActiveEvent()
            }
            ConsentScreen(
                consentText = consentState.consentText.ifBlank {
                    activeEvent?.config?.consentText.orEmpty()
                }.ifBlank {
                    "I consent to having my photo taken at this event and understand images may be shared with other guests."
                },
                onAccept = { consentViewModel.accept { navController.navigate(Routes.CAPTURE) } },
                onDecline = { navController.popBackStack() },
            )
        }
        composable(Routes.CAPTURE) {
            CaptureScreen(
                onCaptureComplete = { result ->
                    scope.launch {
                        val captureId = mainViewModel.processCapture(result)
                        currentMediaPath = mainViewModel.lastCompositePath ?: result.localPath
                        currentCaptureId = captureId
                        navController.navigate(Routes.SHARE)
                    }
                },
            )
        }
        composable(Routes.SHARE) {
            val captureId = currentCaptureId ?: "local"
            val qrUrl = qrGenerator.localUrl(
                port = com.futad.photobooth.feature.sharing.LocalMediaServer.DEFAULT_PORT,
                captureId = captureId,
            )
            ShareScreen(
                captureId = captureId,
                qrContent = qrUrl,
                onWhatsAppShare = {
                    currentMediaPath?.let { mainViewModel.shareWhatsApp(File(it)) }
                },
                onEmailShare = {
                    currentMediaPath?.let { mainViewModel.shareEmail(File(it)) }
                },
                onDone = {
                    currentMediaPath = null
                    currentCaptureId = null
                    navController.navigate(Routes.ATTRACT) {
                        popUpTo(Routes.ATTRACT) { inclusive = true }
                    }
                },
                qrGenerator = qrGenerator,
            )
        }
        composable(Routes.ADMIN) {
            var needsPinSetup by remember { mutableStateOf(!pinManager.isPinSet()) }
            if (needsPinSetup) {
                SetPinScreen(
                    onPinSet = { needsPinSetup = false },
                    onSetPin = { pin ->
                        runCatching { pinManager.setPin(pin) }.isSuccess
                    },
                )
            } else {
                AdminScreen(
                    deviceStatus = DeviceStatusProvider.from(
                        context = context,
                        uploadQueue = mainViewModel.uploadQueueCount,
                        printQueue = mainViewModel.printQueueCount,
                    ),
                    activeEvent = activeEvent,
                    companionHostIp = companionHostIp,
                    onCompanionHostIpChange = { companionHostIp = it },
                    onSaveCompanionHostIp = {
                        scope.launch {
                            credentialsStore.setCompanionHostIp(companionHostIp)
                        }
                    },
                    onUnlock = adminUnlockManager::verifyPin,
                    onCreateDemoEvent = {
                        scope.launch {
                            val demo = demoWeddingEvent()
                            mainViewModel.saveEvent(demo)
                            credentialsStore.setActiveEventId(demo.eventId)
                            syncScheduler.scheduleEventConfigSync(demo.eventId, immediate = true)
                        }
                    },
                    onUnpair = {
                        scope.launch {
                            shellViewModel.unpairDevice()
                            navController.navigate(Routes.PAIRING) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                    onExitAdmin = { navController.popBackStack() },
                )
            }
        }
    }
}

