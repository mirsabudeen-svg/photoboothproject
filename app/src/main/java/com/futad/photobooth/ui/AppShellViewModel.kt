package com.futad.photobooth.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.futad.photobooth.core.data.repository.DevicesRepository
import com.futad.photobooth.core.data.store.DeviceCredentialsStore
import com.futad.photobooth.core.designsystem.theme.themePackById
import com.futad.photobooth.core.domain.repository.EventRepository
import com.futad.photobooth.feature.sync.SyncScheduler
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AppShellViewModel @Inject constructor(
    eventRepository: EventRepository,
    private val credentialsStore: DeviceCredentialsStore,
    private val devicesRepository: DevicesRepository,
    private val syncScheduler: SyncScheduler,
) : ViewModel() {
    val isPaired = credentialsStore.tokenFlow
        .map { !it.isNullOrBlank() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), false)

    val themePack = eventRepository.observeActiveEvent()
        .map { event -> themePackById(event?.config?.themeId ?: "luxury_gold") }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), themePackById("luxury_gold"))

    init {
        viewModelScope.launch {
            val eventId = credentialsStore.getActiveEventId()
            if (eventId != null) {
                syncScheduler.scheduleEventConfigSync(eventId, immediate = true)
            }
        }
    }

    suspend fun unpairDevice() {
        devicesRepository.unpair()
    }
}
