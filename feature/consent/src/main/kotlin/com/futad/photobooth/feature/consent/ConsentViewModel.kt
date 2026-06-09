package com.futad.photobooth.feature.consent

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.futad.photobooth.core.domain.repository.ConsentRepository
import com.futad.photobooth.core.domain.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class ConsentUiState(
    val consentText: String = "",
    val sessionId: String = UUID.randomUUID().toString(),
    val accepted: Boolean = false,
)

@HiltViewModel
class ConsentViewModel @Inject constructor(
    private val consentRepository: ConsentRepository,
    private val eventRepository: EventRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(ConsentUiState())
    val uiState: StateFlow<ConsentUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            val event = eventRepository.getActiveEvent()
            _uiState.value = _uiState.value.copy(
                consentText = event?.config?.consentText ?: ConsentUiState().consentText,
            )
        }
    }

    fun accept(onAccepted: () -> Unit) {
        viewModelScope.launch {
            val eventId = eventRepository.getActiveEvent()?.eventId ?: return@launch
            consentRepository.recordConsent(
                eventId = eventId,
                sessionId = _uiState.value.sessionId,
                accepted = true,
                timestamp = System.currentTimeMillis(),
            )
            _uiState.value = _uiState.value.copy(accepted = true)
            onAccepted()
        }
    }
}
