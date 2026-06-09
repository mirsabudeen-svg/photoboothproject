package com.futad.photobooth

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.core.content.ContextCompat
import androidx.core.content.ContextCompat.startForegroundService
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.futad.photobooth.core.designsystem.theme.PhotoboothTheme
import com.futad.photobooth.kiosk.KioskForegroundService
import com.futad.photobooth.kiosk.KioskModeManager
import com.futad.photobooth.feature.sync.TokenRefreshWorker
import com.futad.photobooth.ui.AppShellViewModel
import com.futad.photobooth.ui.navigation.PhotoboothNavHost
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var kioskModeManager: KioskModeManager
    private val shellViewModel: AppShellViewModel by viewModels()

    private val cameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { /* CaptureScreen handles denial */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            cameraPermission.launch(Manifest.permission.CAMERA)
        }
        startForegroundService(this, Intent(this, KioskForegroundService::class.java))
        TokenRefreshWorker.schedule(this)
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            startActivity(
                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                },
            )
        }
        kioskModeManager.enterLockTask(this)
        setContent {
            val themePack by shellViewModel.themePack.collectAsStateWithLifecycle()
            PhotoboothTheme(themePack = themePack) {
                PhotoboothNavHost(shellViewModel = shellViewModel)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        kioskModeManager.enterLockTask(this)
    }
}
