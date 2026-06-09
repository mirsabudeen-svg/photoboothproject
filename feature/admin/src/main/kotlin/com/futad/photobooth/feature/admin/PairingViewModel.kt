package com.futad.photobooth.feature.admin

import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.futad.photobooth.core.data.repository.DevicesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class PairingState {
    data object Idle : PairingState()
    data object Pairing : PairingState()
    data object Success : PairingState()
    data class Error(val message: String) : PairingState()
}

@HiltViewModel
class PairingViewModel @Inject constructor(
    private val devicesRepository: DevicesRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<PairingState>(PairingState.Idle)
    val state: StateFlow<PairingState> = _state.asStateFlow()

    fun pair(code: String, deviceName: String) {
        viewModelScope.launch {
            _state.value = PairingState.Pairing
            runCatching {
                devicesRepository.pair(
                    pairingCode = code,
                    deviceName = deviceName,
                    deviceModel = Build.MODEL,
                    appVersion = "1.0.0",
                    osVersion = Build.VERSION.RELEASE,
                )
            }.onSuccess {
                _state.value = PairingState.Success
            }.onFailure {
                _state.value = PairingState.Error(it.message ?: "Pairing failed")
            }
        }
    }
}
