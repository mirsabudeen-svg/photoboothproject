package com.futad.photobooth.feature.capture

import android.graphics.BitmapFactory
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.futad.photobooth.core.designsystem.components.BigButton
import com.futad.photobooth.core.designsystem.components.CountdownOverlay
import com.futad.photobooth.core.domain.model.CaptureType
import com.futad.photobooth.feature.capture.CaptureViewModel.CapturePhase
import com.futad.photobooth.feature.capture.CaptureResult

@Composable
fun CaptureScreen(
    onCaptureComplete: (CaptureResult) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: CaptureViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.bindCamera(lifecycleOwner)
    }

    DisposableEffect(Unit) {
        onDispose { viewModel.unbindCamera() }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).also { preview ->
                    preview.controller = viewModel.getCameraController()
                }
            },
            modifier = Modifier.fillMaxSize(),
        )

        when (state.phase) {
            CapturePhase.MODE_SELECT -> ModeSelect(
                onSelect = viewModel::selectMode,
            )
            CapturePhase.COUNTDOWN -> CountdownOverlay(
                count = state.countdown,
                modifier = Modifier.align(Alignment.Center),
            )
            CapturePhase.PREVIEW -> PreviewActions(
                onRetake = viewModel::retake,
                onConfirm = { viewModel.confirmCapture(onCaptureComplete) },
            )
            else -> Unit
        }

        if (state.phase == CapturePhase.READY) {
            BigButton(
                text = "Capture",
                onClick = viewModel::startCountdown,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(32.dp),
            )
        }
    }
}

@Composable
private fun ModeSelect(onSelect: (CaptureType) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        BigButton(text = "Photo", onClick = { onSelect(CaptureType.PHOTO) })
        BigButton(text = "GIF", onClick = { onSelect(CaptureType.GIF) })
        BigButton(text = "Boomerang", onClick = { onSelect(CaptureType.BOOMERANG) })
    }
}

@Composable
private fun PreviewActions(onRetake: () -> Unit, onConfirm: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        BigButton(text = "Retake", onClick = onRetake)
        BigButton(text = "Use Photo", onClick = onConfirm)
    }
}

