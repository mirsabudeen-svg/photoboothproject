package com.futad.photobooth.core.designsystem.theme

import androidx.compose.ui.graphics.Color

object WeddingColors {
    val LuxuryGold = Color(0xFFFFD700)
    val RoyalPurple = Color(0xFF4A148C)
    val KeralaRed = Color(0xFFB71C1C)
    val KeralaGold = Color(0xFFFFC107)
    val Ivory = Color(0xFFFFF8E7)
    val Charcoal = Color(0xFF212121)
    val SoftWhite = Color(0xFFFAFAFA)
}

data class WeddingThemePack(
    val id: String,
    val displayName: String,
    val primary: Color,
    val secondary: Color,
    val background: Color,
)

val WeddingThemePacks = listOf(
    WeddingThemePack("luxury_gold", "Luxury Gold", WeddingColors.LuxuryGold, WeddingColors.Ivory, WeddingColors.Charcoal),
    WeddingThemePack("kerala_traditional", "Kerala Traditional", WeddingColors.KeralaRed, WeddingColors.KeralaGold, WeddingColors.Ivory),
    WeddingThemePack("royal_purple", "Royal Purple", WeddingColors.RoyalPurple, WeddingColors.LuxuryGold, WeddingColors.Charcoal),
)

fun themePackById(id: String): WeddingThemePack =
    WeddingThemePacks.find { it.id == id } ?: WeddingThemePacks.first()
