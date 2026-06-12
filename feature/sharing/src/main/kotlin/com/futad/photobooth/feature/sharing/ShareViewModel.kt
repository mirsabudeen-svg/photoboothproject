package com.futad.photobooth.feature.sharing

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.futad.photobooth.core.domain.model.ShareChannel
import com.futad.photobooth.core.domain.usecase.EnqueueShareUseCase
import com.futad.photobooth.feature.sync.SyncScheduler
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ShareUiEvent {
    data class SmsQueued(val phoneMasked: String) : ShareUiEvent
    data class SmsFailed(val reason: SmsFailReason) : ShareUiEvent
    data object SmsQueuedOffline : ShareUiEvent
}

enum class SmsFailReason {
    INVALID_NUMBER,
    OFFLINE_QUEUE_FULL,
    UNKNOWN,
}

private val E164_REGEX = Regex("""^\+[1-9]\d{7,14}$""")

@HiltViewModel
class ShareViewModel @Inject constructor(
    private val enqueueShareUseCase: EnqueueShareUseCase,
    private val syncScheduler: SyncScheduler,
    private val connectivity: NetworkConnectivity,
) : ViewModel() {

    private val _events = Channel<ShareUiEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    var isSending by mutableStateOf(false)
        private set

    fun sendSms(captureId: String, phone: String) {
        val normalized = phone.trim().takeIf { E164_REGEX.matches(it) }
            ?: run {
                _events.trySend(ShareUiEvent.SmsFailed(SmsFailReason.INVALID_NUMBER))
                return
            }
        viewModelScope.launch {
            isSending = true
            runCatching {
                enqueueShareUseCase(captureId, ShareChannel.SMS, normalized)
                syncScheduler.scheduleShareNow()
            }.onSuccess {
                _events.send(
                    if (connectivity.isOnline()) {
                        ShareUiEvent.SmsQueued(normalized.maskPhone())
                    } else {
                        ShareUiEvent.SmsQueuedOffline
                    },
                )
            }.onFailure {
                _events.send(ShareUiEvent.SmsFailed(SmsFailReason.UNKNOWN))
            }
            isSending = false
        }
    }
}

private fun String.maskPhone(): String =
    if (length > 4) "•••${takeLast(4)}" else this
