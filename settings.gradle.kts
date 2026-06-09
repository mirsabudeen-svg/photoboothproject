pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "wedding-photobooth"

include(":app")
include(":kiosk")
include(":core:domain")
include(":core:data")
include(":core:database")
include(":core:network")
include(":core:designsystem")
include(":feature:attract")
include(":feature:consent")
include(":feature:capture")
include(":feature:overlay")
include(":feature:ai")
include(":feature:printing")
include(":feature:sharing")
include(":feature:sync")
include(":feature:admin")
include(":hardware:camera")
include(":hardware:printer")
