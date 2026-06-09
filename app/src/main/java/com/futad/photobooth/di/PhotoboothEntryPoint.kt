package com.futad.photobooth.di

import com.futad.photobooth.core.data.store.DeviceCredentialsStore
import com.futad.photobooth.core.data.store.PinManager
import com.futad.photobooth.feature.sharing.QRCodeGenerator
import com.futad.photobooth.feature.sync.SyncScheduler
import com.futad.photobooth.kiosk.AdminUnlockManager
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@EntryPoint
@InstallIn(SingletonComponent::class)
interface PhotoboothEntryPoint {
    fun adminUnlockManager(): AdminUnlockManager
    fun qrCodeGenerator(): QRCodeGenerator
    fun pinManager(): PinManager
    fun deviceCredentialsStore(): DeviceCredentialsStore
    fun syncScheduler(): SyncScheduler
}
