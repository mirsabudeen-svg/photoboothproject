package com.futad.photobooth.feature.capture

import com.futad.photobooth.core.domain.model.CaptureType
import com.futad.photobooth.feature.capture.CaptureViewModel.CapturePhase
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class CaptureViewModelStateTest {
    @Test
    fun countdownPhaseUsesExpectedDefaultCount() {
        val state = CaptureViewModel.CaptureUiState(phase = CapturePhase.COUNTDOWN, countdown = 3)
        assertEquals(CapturePhase.COUNTDOWN, state.phase)
        assertEquals(3, state.countdown)
    }

    @Test
    fun previewPhaseHoldsPath() {
        val state = CaptureViewModel.CaptureUiState(phase = CapturePhase.PREVIEW, previewPath = "/tmp/x.jpg")
        assertEquals("/tmp/x.jpg", state.previewPath)
    }

    @Test
    fun retakeResetsPreviewAndError() {
        val state = CaptureViewModel.CaptureUiState(
            phase = CapturePhase.READY,
            previewPath = null,
            errorMessage = null,
        )
        assertEquals(CapturePhase.READY, state.phase)
        assertNull(state.previewPath)
    }

    @Test
    fun modeSelectHasSelectedModeNull() {
        val state = CaptureViewModel.CaptureUiState(phase = CapturePhase.MODE_SELECT)
        assertNull(state.selectedMode)
    }

    @Test
    fun readyPhaseWithPhotoMode() {
        val state = CaptureViewModel.CaptureUiState(phase = CapturePhase.READY, selectedMode = CaptureType.PHOTO)
        assertEquals(CaptureType.PHOTO, state.selectedMode)
    }

    @Test
    fun errorMessageStoredOnFailure() {
        val state = CaptureViewModel.CaptureUiState(phase = CapturePhase.READY, errorMessage = "Camera unavailable")
        assertEquals("Camera unavailable", state.errorMessage)
    }
}
