package com.futad.photobooth.feature.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.futad.photobooth.core.designsystem.components.BigButton

@Composable
fun PairingScreen(
    onPaired: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PairingViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var code by remember { mutableStateOf("") }

    if (state is PairingState.Success) {
        onPaired()
    }

    Column(
        modifier = modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Pair This Booth", fontSize = 32.sp, color = MaterialTheme.colorScheme.primary)
        Text("Enter the pairing code from your operator.", fontSize = 18.sp)
        OutlinedTextField(
            value = code,
            onValueChange = { code = it.uppercase().take(16) },
            label = { Text("Pairing code") },
            singleLine = true,
        )
        when (state) {
            is PairingState.Pairing -> CircularProgressIndicator()
            is PairingState.Error -> Text(
                (state as PairingState.Error).message,
                color = MaterialTheme.colorScheme.error,
            )
            else -> Unit
        }
        BigButton(
            text = "Pair Device",
            enabled = code.length >= 4 && state !is PairingState.Pairing,
            onClick = { viewModel.pair(code.trim(), deviceName = "Booth-${code.takeLast(4)}") },
        )
    }
}
