Unicode true

####
## Please note: Template replacements don't work in this file. They are provided with default defines like
## mentioned underneath.
## If the keyword is not defined, "wails_tools.nsh" will populate them with the values from ProjectInfo.
## If they are defined here, "wails_tools.nsh" will not touch them. This allows to use this project.nsi manually
## from outside of Wails for debugging and development of the installer.
##
## For development first make a wails nsis build to populate the "wails_tools.nsh":
## > wails build --target windows/amd64 --nsis
## Then you can call makensis on this file with specifying the path to your binary:
## For a AMD64 only installer:
## > makensis -DARG_WAILS_AMD64_BINARY=..\..\bin\app.exe
## For a ARM64 only installer:
## > makensis -DARG_WAILS_ARM64_BINARY=..\..\bin\app.exe
## For a installer with both architectures:
## > makensis -DARG_WAILS_AMD64_BINARY=..\..\bin\app-amd64.exe -DARG_WAILS_ARM64_BINARY=..\..\bin\app-arm64.exe
!define INFO_PROJECTNAME    "CompilaRC-Desktop"
!define INFO_COMPANYNAME    "Consejo Nacional Electoral"
!define INFO_PRODUCTNAME    "CompilaRC Desktop"
!define INFO_PRODUCTVERSION "1.0.0"
!define INFO_COPYRIGHT      "Copyright 2026 Consejo Nacional Electoral (CNE)"
!define PRODUCT_EXECUTABLE  "compilarc-desktop.exe"
!define UNINST_KEY_NAME     "CompilaRCDesktop"

!include "wails_tools.nsh"

# The version information for this two must consist of 4 parts
VIProductVersion "${INFO_PRODUCTVERSION}.0"
VIFileVersion    "${INFO_PRODUCTVERSION}.0"

VIAddVersionKey "CompanyName"     "${INFO_COMPANYNAME}"
VIAddVersionKey "FileDescription" "Instalador Oficial de CompilaRC Desktop - Registro Civil"
VIAddVersionKey "ProductVersion"  "${INFO_PRODUCTVERSION}"
VIAddVersionKey "FileVersion"     "${INFO_PRODUCTVERSION}"
VIAddVersionKey "LegalCopyright"  "${INFO_COPYRIGHT}"
VIAddVersionKey "ProductName"     "${INFO_PRODUCTNAME}"

# Enable HiDPI support. https://nsis.sourceforge.io/Reference/ManifestDPIAware
ManifestDPIAware true

!include "MUI2.nsh"

!define MUI_ICON "..\icon.ico"
!define MUI_UNICON "..\icon.ico"

# Banners gráficos institucionales oficiales CNE / CompilaRC
!define MUI_WELCOMEFINISHPAGE_BITMAP "resources\leftimage.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "resources\leftimage.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "resources\headerimage.bmp"
!define MUI_HEADERIMAGE_RIGHT

!define MUI_ABORTWARNING

# Textos de Bienvenida y Finalización
!define MUI_WELCOMEPAGE_TITLE "Instalador de CompilaRC Desktop"
!define MUI_WELCOMEPAGE_TEXT "Bienvenido al asistente de instalación de CompilaRC Desktop.$\r$\n$\r$\nPlataforma Oficial de Certificaciones de Registro Civil y Captura Biométrica del Consejo Nacional Electoral (CNE).$\r$\n$\r$\nHaga clic en Siguiente para continuar con la instalación."

!define MUI_FINISHPAGE_TITLE "¡Instalación Completada con Éxito!"
!define MUI_FINISHPAGE_TEXT "CompilaRC Desktop ha sido instalado correctamente en su estación de trabajo con su base de datos local SQLite configurada.$\r$\n$\r$\nSe ha colocado el acceso directo oficial en su Escritorio."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar CompilaRC Desktop ahora"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Spanish"

BrandingText "Consejo Nacional Electoral • Registro Civil Venezolano"

Name "${INFO_PRODUCTNAME}"
OutFile "..\..\bin\CompilaRC-Desktop-Setup-v1.0.exe"

InstallDir "$PROGRAMFILES64\CompilaRC"
ShowInstDetails show

Function .onInit
   !insertmacro wails.checkArchitecture
FunctionEnd

Section
    !insertmacro wails.setShellContext

    !insertmacro wails.webview2runtime

    SetOutPath $INSTDIR

    !insertmacro wails.files

    ; Instalar base de datos local SQLite (Padrón offline y almacenamiento de solicitudes)
    SetOutPath "$INSTDIR\data"
    File /r "..\..\bin\data\*.*"

    SetOutPath $INSTDIR
    CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}" "" "$INSTDIR\${PRODUCT_EXECUTABLE}" 0
    CreateShortCut "$DESKTOP\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}" "" "$INSTDIR\${PRODUCT_EXECUTABLE}" 0

    !insertmacro wails.associateFiles
    !insertmacro wails.associateCustomProtocols

    !insertmacro wails.writeUninstaller
SectionEnd

Section "uninstall"
    !insertmacro wails.setShellContext

    RMDir /r "$AppData\${PRODUCT_EXECUTABLE}" # Remove the WebView2 DataPath

    RMDir /r $INSTDIR

    Delete "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk"
    Delete "$DESKTOP\${INFO_PRODUCTNAME}.lnk"

    !insertmacro wails.unassociateFiles
    !insertmacro wails.unassociateCustomProtocols

    !insertmacro wails.deleteUninstaller
SectionEnd
