@echo off
REM Employee Management System Deployment Script for Windows
REM This script automates the deployment process for different environments

setlocal enabledelayedexpansion

REM Configuration
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set WAR_NAME=employee-management-system.war
set DEFAULT_PROFILE=prod

REM Default values
set PROFILE=%DEFAULT_PROFILE%
set TARGET=
set DEPLOY_DIR=
set SKIP_TESTS=false
set BACKUP=false
set CLEAN=false

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :args_parsed
if "%~1"=="-p" (
    set PROFILE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--profile" (
    set PROFILE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-t" (
    set TARGET=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--target" (
    set TARGET=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-d" (
    set DEPLOY_DIR=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--deploy-dir" (
    set DEPLOY_DIR=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-s" (
    set SKIP_TESTS=true
    shift
    goto :parse_args
)
if "%~1"=="--skip-tests" (
    set SKIP_TESTS=true
    shift
    goto :parse_args
)
if "%~1"=="-b" (
    set BACKUP=true
    shift
    goto :parse_args
)
if "%~1"=="--backup" (
    set BACKUP=true
    shift
    goto :parse_args
)
if "%~1"=="-c" (
    set CLEAN=true
    shift
    goto :parse_args
)
if "%~1"=="--clean" (
    set CLEAN=true
    shift
    goto :parse_args
)
if "%~1"=="-h" goto :show_help
if "%~1"=="--help" goto :show_help
echo [ERROR] Unknown option: %~1
goto :show_help

:args_parsed

REM Validate profile
if "%PROFILE%"=="dev" goto :profile_valid
if "%PROFILE%"=="test" goto :profile_valid
if "%PROFILE%"=="staging" goto :profile_valid
if "%PROFILE%"=="prod" goto :profile_valid
echo [ERROR] Invalid profile: %PROFILE%. Must be one of: dev, test, staging, prod
exit /b 1

:profile_valid

REM Detect deployment target if not specified
if not "%TARGET%"=="" goto :target_set
if not "%CATALINA_HOME%"=="" (
    if exist "%CATALINA_HOME%" (
        set TARGET=tomcat
        echo [INFO] Auto-detected Tomcat deployment target
        goto :target_set
    )
)
set TARGET=standalone
echo [INFO] Using standalone deployment target

:target_set

REM Set deployment directory based on target
if not "%DEPLOY_DIR%"=="" goto :deploy_dir_set
if "%TARGET%"=="tomcat" (
    if "%CATALINA_HOME%"=="" (
        echo [ERROR] CATALINA_HOME not set and no deployment directory specified
        exit /b 1
    )
    set DEPLOY_DIR=%CATALINA_HOME%\webapps
) else if "%TARGET%"=="standalone" (
    set DEPLOY_DIR=%PROJECT_DIR%\target
)

:deploy_dir_set

echo [INFO] Starting deployment with the following configuration:
echo [INFO]   Profile: %PROFILE%
echo [INFO]   Target: %TARGET%
echo [INFO]   Deploy Directory: %DEPLOY_DIR%
echo [INFO]   Skip Tests: %SKIP_TESTS%
echo [INFO]   Backup: %BACKUP%
echo [INFO]   Clean: %CLEAN%

REM Change to project directory
cd /d "%PROJECT_DIR%"

REM Pre-deployment checks
echo [INFO] Running pre-deployment checks...

REM Check Java
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found. Please install Java 24 or higher.
    exit /b 1
)

REM Check Maven
mvn -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven not found. Please install Maven.
    exit /b 1
)

REM Check deployment directory
if not exist "%DEPLOY_DIR%" (
    echo [ERROR] Deployment directory does not exist: %DEPLOY_DIR%
    exit /b 1
)

echo [SUCCESS] Pre-deployment checks passed

REM Create backup if requested
if "%BACKUP%"=="true" (
    if not "%TARGET%"=="standalone" (
        set BACKUP_DIR=%PROJECT_DIR%\backups\%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
        set BACKUP_DIR=!BACKUP_DIR: =0!
        mkdir "!BACKUP_DIR!" 2>nul
        
        if exist "%DEPLOY_DIR%\%WAR_NAME%" (
            echo [INFO] Creating backup of existing deployment...
            copy "%DEPLOY_DIR%\%WAR_NAME%" "!BACKUP_DIR!\" >nul
            echo [SUCCESS] Backup created at: !BACKUP_DIR!\%WAR_NAME%
        ) else (
            echo [INFO] No existing deployment found to backup
        )
    )
)

REM Clean if requested
if "%CLEAN%"=="true" (
    echo [INFO] Cleaning target directory...
    mvn clean
    if errorlevel 1 (
        echo [ERROR] Clean failed
        exit /b 1
    )
    echo [SUCCESS] Target directory cleaned
)

REM Build the application
echo [INFO] Building application with profile: %PROFILE%

set BUILD_CMD=mvn package -P%PROFILE%
if "%SKIP_TESTS%"=="true" (
    set BUILD_CMD=!BUILD_CMD! -DskipTests
)

echo [INFO] Running: !BUILD_CMD!
!BUILD_CMD!
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)

echo [SUCCESS] Build completed successfully

REM Verify WAR file exists
set WAR_PATH=%PROJECT_DIR%\target\%WAR_NAME%
if not exist "%WAR_PATH%" (
    echo [ERROR] WAR file not found: %WAR_PATH%
    exit /b 1
)

REM Deploy based on target
if "%TARGET%"=="tomcat" goto :deploy_tomcat
if "%TARGET%"=="standalone" goto :deploy_standalone

:deploy_tomcat
echo [INFO] Deploying to Tomcat...

REM Stop Tomcat if running
tasklist /FI "IMAGENAME eq java.exe" | find "java.exe" >nul
if not errorlevel 1 (
    echo [INFO] Stopping Tomcat...
    if exist "%CATALINA_HOME%\bin\shutdown.bat" (
        call "%CATALINA_HOME%\bin\shutdown.bat"
        timeout /t 5 >nul
    )
)

REM Remove old deployment
if exist "%DEPLOY_DIR%\%WAR_NAME%" (
    echo [INFO] Removing old deployment...
    del "%DEPLOY_DIR%\%WAR_NAME%"
)

REM Remove exploded directory
set EXPLODED_DIR=%DEPLOY_DIR%\employee-management-system
if exist "%EXPLODED_DIR%" (
    echo [INFO] Removing exploded directory...
    rmdir /s /q "%EXPLODED_DIR%"
)

REM Copy new WAR file
echo [INFO] Copying WAR file to deployment directory...
copy "%WAR_PATH%" "%DEPLOY_DIR%\" >nul
if errorlevel 1 (
    echo [ERROR] Failed to copy WAR file
    exit /b 1
)

REM Start Tomcat
echo [INFO] Starting Tomcat...
if exist "%CATALINA_HOME%\bin\startup.bat" (
    call "%CATALINA_HOME%\bin\startup.bat"
)

echo [SUCCESS] Deployment completed to Tomcat
goto :post_deployment

:deploy_standalone
echo [INFO] Preparing standalone deployment...

REM Create run script
set RUN_SCRIPT=%PROJECT_DIR%\run.bat
echo @echo off > "%RUN_SCRIPT%"
echo REM Employee Management System Standalone Runner >> "%RUN_SCRIPT%"
echo. >> "%RUN_SCRIPT%"
echo set SCRIPT_DIR=%%~dp0 >> "%RUN_SCRIPT%"
echo set WAR_FILE=%%SCRIPT_DIR%%target\%WAR_NAME% >> "%RUN_SCRIPT%"
echo. >> "%RUN_SCRIPT%"
echo if not exist "%%WAR_FILE%%" ^( >> "%RUN_SCRIPT%"
echo     echo WAR file not found: %%WAR_FILE%% >> "%RUN_SCRIPT%"
echo     exit /b 1 >> "%RUN_SCRIPT%"
echo ^) >> "%RUN_SCRIPT%"
echo. >> "%RUN_SCRIPT%"
echo echo Starting Employee Management System... >> "%RUN_SCRIPT%"
echo echo Profile: %PROFILE% >> "%RUN_SCRIPT%"
echo echo WAR file: %%WAR_FILE%% >> "%RUN_SCRIPT%"
echo. >> "%RUN_SCRIPT%"
echo java -jar "%%WAR_FILE%%" --spring.profiles.active=%PROFILE% %%* >> "%RUN_SCRIPT%"

echo [SUCCESS] Standalone deployment prepared
echo [INFO] To run the application, execute: run.bat

:post_deployment

REM Display deployment summary
echo [SUCCESS] Deployment Summary:
echo [INFO]   Profile: %PROFILE%
echo [INFO]   Target: %TARGET%
echo [INFO]   WAR file: %WAR_PATH%
echo [INFO]   Deployed to: %DEPLOY_DIR%
if "%BACKUP%"=="true" (
    if defined BACKUP_DIR echo [INFO]   Backup: !BACKUP_DIR!
)

REM Display next steps
echo [INFO] Next Steps:
if "%TARGET%"=="tomcat" (
    echo [INFO]   - Check Tomcat logs: type "%CATALINA_HOME%\logs\catalina.out"
    echo [INFO]   - Access application: http://localhost:8080/employee-management-system
) else if "%TARGET%"=="standalone" (
    echo [INFO]   - Run application: run.bat
    echo [INFO]   - Run with custom options: run.bat --server.port=9090
)

echo [INFO]   - Health check: http://localhost:8080/employee-management-system/api/actuator/health
echo [INFO]   - View configuration guide: type CONFIGURATION.md
echo [INFO]   - View deployment guide: type DEPLOYMENT.md

echo [SUCCESS] Deployment completed successfully!
goto :end

:show_help
echo Employee Management System Deployment Script for Windows
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo OPTIONS:
echo     -p, --profile PROFILE    Spring profile to use (dev, test, staging, prod)
echo     -t, --target TARGET      Deployment target (tomcat, standalone)
echo     -d, --deploy-dir DIR     Deployment directory (for tomcat)
echo     -s, --skip-tests         Skip running tests during build
echo     -b, --backup             Create backup before deployment
echo     -c, --clean              Clean target directory before build
echo     -h, --help               Show this help message
echo.
echo EXAMPLES:
echo     %~nx0 --profile prod --target tomcat --deploy-dir C:\tomcat\webapps
echo     %~nx0 --profile staging --target standalone
echo     %~nx0 --profile dev --skip-tests --clean
echo.
echo ENVIRONMENT VARIABLES:
echo     CATALINA_HOME           Tomcat installation directory
echo     JAVA_HOME              Java installation directory
exit /b 0

:end
endlocal