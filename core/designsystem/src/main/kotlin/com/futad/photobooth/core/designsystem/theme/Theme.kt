package com.futad.photobooth.core.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkScheme = darkColorScheme(
    primary = WeddingColors.LuxuryGold,
    secondary = WeddingColors.Ivory,
    background = WeddingColors.Charcoal,
    surface = Color(0xFF2C2C2C),
    onPrimary = WeddingColors.Charcoal,
    onBackground = WeddingColors.SoftWhite,
)

@Composable
fun PhotoboothTheme(
    themePack: WeddingThemePack = WeddingThemePacks.first(),
    content: @Composable () -> Unit,
) {
    val scheme = lightColorScheme(
        primary = themePack.primary,
        secondary = themePack.secondary,
        background = themePack.background,
        surface = themePack.background,
        onPrimary = WeddingColors.Charcoal,
        onBackground = WeddingColors.Charcoal,
    )
    MaterialTheme(
        colorScheme = if (themePack.id == "luxury_gold") DarkScheme else scheme,
        content = content,
    )
}
