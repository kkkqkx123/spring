#!/bin/bash

# Employee Management System Deployment Script
# This script automates the deployment process for different environments

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WAR_NAME="employee-management-system.war"
DEFAULT_PROFILE="prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Employee Management System Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -p, --profile PROFILE    Spring profile to use (dev, test, staging, prod)
    -t, --target TARGET      Deployment target (tomcat, jetty, standalone)
    -d, --deploy-dir DIR     Deployment directory (for tomcat/jetty)
    -s, --skip-tests         Skip running tests during build
    -b, --backup             Create backup before deployment
    -c, --clean              Clean target directory before build
    -h, --help               Show this help message

EXAMPLES:
    $0 --profile prod --target tomcat --deploy-dir /opt/tomcat/webapps
    $0 --profile staging --target standalone
    $0 --profile dev --skip-tests --clean

ENVIRONMENT VARIABLES:
    CATALINA_HOME           Tomcat installation directory
    JETTY_HOME             Jetty installation directory
    JAVA_HOME              Java installation directory
EOF
}

# Parse command line arguments
PROFILE="$DEFAULT_PROFILE"
TARGET=""
DEPLOY_DIR=""
SKIP_TESTS=false
BACKUP=false
CLEAN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -t|--target)
            TARGET="$2"
            shift 2
            ;;
        -d|--deploy-dir)
            DEPLOY_DIR="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--backup)
            BACKUP=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate profile
case $PROFILE in
    dev|test|staging|prod)
        ;;
    *)
        log_error "Invalid profile: $PROFILE. Must be one of: dev, test, staging, prod"
        exit 1
        ;;
esac

# Detect deployment target if not specified
if [[ -z "$TARGET" ]]; then
    if [[ -n "$CATALINA_HOME" && -d "$CATALINA_HOME" ]]; then
        TARGET="tomcat"
        log_info "Auto-detected Tomcat deployment target"
    elif [[ -n "$JETTY_HOME" && -d "$JETTY_HOME" ]]; then
        TARGET="jetty"
        log_info "Auto-detected Jetty deployment target"
    else
        TARGET="standalone"
        log_info "Using standalone deployment target"
    fi
fi

# Set deployment directory based on target
if [[ -z "$DEPLOY_DIR" ]]; then
    case $TARGET in
        tomcat)
            if [[ -n "$CATALINA_HOME" ]]; then
                DEPLOY_DIR="$CATALINA_HOME/webapps"
            else
                log_error "CATALINA_HOME not set and no deployment directory specified"
                exit 1
            fi
            ;;
        jetty)
            if [[ -n "$JETTY_HOME" ]]; then
                DEPLOY_DIR="$JETTY_HOME/webapps"
            else
                log_error "JETTY_HOME not set and no deployment directory specified"
                exit 1
            fi
            ;;
        standalone)
            DEPLOY_DIR="$PROJECT_DIR/target"
            ;;
    esac
fi

log_info "Starting deployment with the following configuration:"
log_info "  Profile: $PROFILE"
log_info "  Target: $TARGET"
log_info "  Deploy Directory: $DEPLOY_DIR"
log_info "  Skip Tests: $SKIP_TESTS"
log_info "  Backup: $BACKUP"
log_info "  Clean: $CLEAN"

# Change to project directory
cd "$PROJECT_DIR"

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check Java version
if ! command -v java &> /dev/null; then
    log_error "Java not found. Please install Java 24 or higher."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [[ "$JAVA_VERSION" -lt 17 ]]; then
    log_warning "Java version $JAVA_VERSION detected. Java 17+ recommended."
fi

# Check Maven
if ! command -v mvn &> /dev/null; then
    log_error "Maven not found. Please install Maven."
    exit 1
fi

# Check deployment directory
if [[ ! -d "$DEPLOY_DIR" ]]; then
    log_error "Deployment directory does not exist: $DEPLOY_DIR"
    exit 1
fi

if [[ ! -w "$DEPLOY_DIR" ]]; then
    log_error "No write permission to deployment directory: $DEPLOY_DIR"
    exit 1
fi

log_success "Pre-deployment checks passed"

# Create backup if requested
if [[ "$BACKUP" == true && "$TARGET" != "standalone" ]]; then
    BACKUP_DIR="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if [[ -f "$DEPLOY_DIR/$WAR_NAME" ]]; then
        log_info "Creating backup of existing deployment..."
        cp "$DEPLOY_DIR/$WAR_NAME" "$BACKUP_DIR/"
        log_success "Backup created at: $BACKUP_DIR/$WAR_NAME"
    else
        log_info "No existing deployment found to backup"
    fi
fi

# Clean if requested
if [[ "$CLEAN" == true ]]; then
    log_info "Cleaning target directory..."
    mvn clean
    log_success "Target directory cleaned"
fi

# Build the application
log_info "Building application with profile: $PROFILE"

BUILD_CMD="mvn package -P$PROFILE"
if [[ "$SKIP_TESTS" == true ]]; then
    BUILD_CMD="$BUILD_CMD -DskipTests"
fi

log_info "Running: $BUILD_CMD"
if ! $BUILD_CMD; then
    log_error "Build failed"
    exit 1
fi

log_success "Build completed successfully"

# Verify WAR file exists
WAR_PATH="$PROJECT_DIR/target/$WAR_NAME"
if [[ ! -f "$WAR_PATH" ]]; then
    log_error "WAR file not found: $WAR_PATH"
    exit 1
fi

# Deploy based on target
case $TARGET in
    tomcat|jetty)
        log_info "Deploying to $TARGET..."
        
        # Stop application if running (optional)
        if [[ "$TARGET" == "tomcat" && -n "$CATALINA_HOME" ]]; then
            if pgrep -f "catalina" > /dev/null; then
                log_info "Stopping Tomcat..."
                "$CATALINA_HOME/bin/shutdown.sh" || true
                sleep 5
            fi
        fi
        
        # Remove old deployment
        if [[ -f "$DEPLOY_DIR/$WAR_NAME" ]]; then
            log_info "Removing old deployment..."
            rm -f "$DEPLOY_DIR/$WAR_NAME"
        fi
        
        # Remove exploded directory
        EXPLODED_DIR="$DEPLOY_DIR/employee-management-system"
        if [[ -d "$EXPLODED_DIR" ]]; then
            log_info "Removing exploded directory..."
            rm -rf "$EXPLODED_DIR"
        fi
        
        # Copy new WAR file
        log_info "Copying WAR file to deployment directory..."
        cp "$WAR_PATH" "$DEPLOY_DIR/"
        
        # Set permissions
        chmod 644 "$DEPLOY_DIR/$WAR_NAME"
        
        # Start application
        if [[ "$TARGET" == "tomcat" && -n "$CATALINA_HOME" ]]; then
            log_info "Starting Tomcat..."
            "$CATALINA_HOME/bin/startup.sh"
        fi
        
        log_success "Deployment completed to $TARGET"
        ;;
        
    standalone)
        log_info "Preparing standalone deployment..."
        
        # Create run script
        RUN_SCRIPT="$PROJECT_DIR/run.sh"
        cat > "$RUN_SCRIPT" << EOF
#!/bin/bash
# Employee Management System Standalone Runner

SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
WAR_FILE="\$SCRIPT_DIR/target/$WAR_NAME"

if [[ ! -f "\$WAR_FILE" ]]; then
    echo "WAR file not found: \$WAR_FILE"
    exit 1
fi

echo "Starting Employee Management System..."
echo "Profile: $PROFILE"
echo "WAR file: \$WAR_FILE"

java -jar "\$WAR_FILE" \\
    --spring.profiles.active=$PROFILE \\
    "\$@"
EOF
        
        chmod +x "$RUN_SCRIPT"
        
        log_success "Standalone deployment prepared"
        log_info "To run the application, execute: ./run.sh"
        ;;
esac

# Post-deployment verification
log_info "Running post-deployment verification..."

# Wait for application to start
if [[ "$TARGET" != "standalone" ]]; then
    log_info "Waiting for application to start..."
    sleep 10
    
    # Check if application is responding
    HEALTH_URL="http://localhost:8080/employee-management-system/api/actuator/health"
    MAX_ATTEMPTS=30
    ATTEMPT=1
    
    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
            log_success "Application is responding at: $HEALTH_URL"
            break
        fi
        
        if [[ $ATTEMPT -eq $MAX_ATTEMPTS ]]; then
            log_warning "Application health check failed after $MAX_ATTEMPTS attempts"
            log_warning "Please check the application logs"
            break
        fi
        
        log_info "Attempt $ATTEMPT/$MAX_ATTEMPTS: Waiting for application to respond..."
        sleep 5
        ((ATTEMPT++))
    done
fi

# Display deployment summary
log_success "Deployment Summary:"
log_info "  Profile: $PROFILE"
log_info "  Target: $TARGET"
log_info "  WAR file: $WAR_PATH"
log_info "  Deployed to: $DEPLOY_DIR"
if [[ "$BACKUP" == true && -n "$BACKUP_DIR" ]]; then
    log_info "  Backup: $BACKUP_DIR"
fi

# Display next steps
log_info "Next Steps:"
case $TARGET in
    tomcat)
        log_info "  - Check Tomcat logs: tail -f $CATALINA_HOME/logs/catalina.out"
        log_info "  - Access application: http://localhost:8080/employee-management-system"
        ;;
    jetty)
        log_info "  - Check Jetty logs in: $JETTY_HOME/logs/"
        log_info "  - Access application: http://localhost:8080/employee-management-system"
        ;;
    standalone)
        log_info "  - Run application: ./run.sh"
        log_info "  - Run with custom options: ./run.sh --server.port=9090"
        ;;
esac

log_info "  - Health check: http://localhost:8080/employee-management-system/api/actuator/health"
log_info "  - View configuration guide: cat CONFIGURATION.md"
log_info "  - View deployment guide: cat DEPLOYMENT.md"

log_success "Deployment completed successfully!"