package com.futad.photobooth.feature.sharing

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.futad.photobooth.core.designsystem.components.BigButton

private val E164_REGEX = Regex("""^\+[1-9]\d{7,14}$""")

@Composable
fun ShareScreen(
    captureId: String,
    qrContent: String,
    onWhatsAppShare: () -> Unit,
    onEmailShare: () -> Unit,
    onDone: () -> Unit,
    qrGenerator: QRCodeGenerator,
    modifier: Modifier = Modifier,
    viewModel: ShareViewModel = hiltViewModel(),
) {
    val snackbarHostState = remember { SnackbarHostState() }
    var smsPhone by remember { mutableStateOf("") }
    val qrBitmap = remember(qrContent) { qrGenerator.generate(qrContent) }
    val isValidPhone = remember(smsPhone) { smsPhone.isBlank() || E164_REGEX.matches(smsPhone.trim()) }

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            val message = when (event) {
                is ShareUiEvent.SmsQueued ->
                    "Sent! Your photo is on its way to ${event.phoneMasked} 📱"
                is ShareUiEvent.SmsQueuedOffline ->
                    "Saved — we'll send it as soon as we're back online ✓"
                is ShareUiEvent.SmsFailed -> when (event.reason) {
                    SmsFailReason.INVALID_NUMBER ->
                        "That number doesn't look right — please check and try again"
                    else -> "Couldn't send right now — try the QR code instead"
                }
            }
            snackbarHostState.showSnackbar(message, duration = SnackbarDuration.Short)
        }
    }

    Scaffold(
        modifier = modifier,
        snackbarHost = {
            SnackbarHost(snackbarHostState) { data ->
                Snackbar(
                    snackbarData = data,
                    modifier = Modifier.padding(24.dp),
                    shape = RoundedCornerShape(16.dp),
                )
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("Scan to download", fontSize = 28.sp, color = MaterialTheme.colorScheme.primary)
            Image(bitmap = qrBitmap.asImageBitmap(), contentDescription = "QR code")
            OutlinedTextField(
                value = smsPhone,
                onValueChange = { smsPhone = it },
                label = { Text("Phone for SMS (E.164)") },
                supportingText = {
                    if (!isValidPhone) Text("Use format +15551234567")
                },
                isError = !isValidPhone,
                modifier = Modifier.padding(vertical = 8.dp),
                singleLine = true,
            )
            BigButton(
                text = if (viewModel.isSending) "Sending…" else "Send SMS",
                onClick = { viewModel.sendSms(captureId, smsPhone) },
                enabled = smsPhone.isNotBlank() && isValidPhone && !viewModel.isSending,
            )
            BigButton(text = "WhatsApp", onClick = onWhatsAppShare)
            BigButton(text = "Email", onClick = onEmailShare)
            BigButton(text = "Done", onClick = onDone)
        }
    }
}
