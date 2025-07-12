pipeline {
    agent any

    environment {
        REMOTE_PATH = "/home/ubuntu/${params.APP_KEY}"
    }

    stages {
        stage('Preparar EC2') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: params.CREDENTIAL_ID,
                                                  keyFileVariable: 'SSH_KEY_FILE',
                                                  usernameVariable: 'EC2_USER')]) {
                    sh """
chmod 600 "$SSH_KEY_FILE"
ssh-keygen -f "/var/lib/jenkins/.ssh/known_hosts" -R "$EC2_HOST" || true
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER"@"$EC2_HOST" << EOF
    set -ex

    export DEBIAN_FRONTEND=noninteractive

    # Instalar Docker si no existe
    if ! command -v docker >/dev/null; then
        sudo apt-get update -y
        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable" -y
        sudo apt-get update -y
        sudo apt-get install -y docker-ce
        sudo systemctl enable --now docker
    fi

    # Instalar Docker Compose si no existe
    if ! command -v docker-compose >/dev/null; then
        ARCH=\$(uname -m)
        OS=\$(uname -s)
        sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\${OS}-\${ARCH}" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi

    # Clonar o actualizar repositorio
    if [ ! -d "${REMOTE_PATH}" ]; then
        git clone -b ${params.GIT_BRANCH} ${params.GIT_REPO} ${REMOTE_PATH}
    else
        cd \${REMOTE_PATH}
        git fetch --all
        git reset --hard origin/${params.GIT_BRANCH}
    fi
EOF
                    """
                                                  }
            }
        }

        stage('Crear archivo .env en EC2') {
            steps {
                script {
                    def envContent = ''
                    try {
                        // Buscar las variables deseadas directamente
                        envContent = sh(script: """
                    env | grep -E '^(NODE_ENV|NODE_NAME|PORT|RABBITMQ_URL|RABBITMQ_QUEUE|MYSQL_|MAIL_|DISCORD_|BUCKET_)'
                """, returnStdout: true).trim()
            } catch (Exception e) {
                        // En caso de error, fallback a búsqueda individual
                        def individualVars = []

                        ['NODE_ENV', 'NODE_NAME', 'PORT', 'RABBITMQ_URL', 'RABBITMQ_QUEUE'].each { varName ->
                            def varValue = sh(script: "echo \$${varName}", returnStdout: true).trim()
                            if (varValue) {
                                individualVars.add("${varName}=${varValue}")
                            }
                        }

                        ['MYSQL_', 'MAIL_', 'DISCORD_', 'BUCKET_'].each { prefix ->
                            def found = sh(script: "env | grep '^${prefix}' || true", returnStdout: true).trim()
                            if (found) {
                                individualVars.addAll(found.split('\n'))
                            }
                        }

                        envContent = individualVars.join('\n')
                    }

                    // ✅ Agregar manualmente las variables requeridas desde params
                    envContent += """
# Variables requeridas
PORT=${params.CONTAINER_PORT}
NODE_NAME=${params.APP_KEY}
""".trim()

                    // Crear el archivo solo si hay contenido
                    if (envContent?.trim()) {
                        writeFile file: 'env_content.sh', text: envContent

                        withCredentials([sshUserPrivateKey(credentialsId: params.CREDENTIAL_ID,
                                                  keyFileVariable: 'SSH_KEY_FILE',
                                                  usernameVariable: 'EC2_USER')]) {
                            sh """
chmod 600 "$SSH_KEY_FILE"
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" 'cat > ${REMOTE_PATH}/.env' << 'EOF'
${envContent}
EOF
                    """
                                                  }
            } else {
                        // Crear un archivo .env vacío como fallback
                        withCredentials([sshUserPrivateKey(credentialsId: params.CREDENTIAL_ID,
                                                  keyFileVariable: 'SSH_KEY_FILE',
                                                  usernameVariable: 'EC2_USER')]) {
                            sh """
chmod 600 "$SSH_KEY_FILE"
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" 'echo "# No environment variables found" > ${REMOTE_PATH}/.env'
                    """
                                                  }
                    }
                }
            }
        }

        stage('Construir y Desplegar') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: params.CREDENTIAL_ID,
                                                  keyFileVariable: 'SSH_KEY_FILE',
                                                  usernameVariable: 'EC2_USER')]) {
                    sh """
chmod 600 "$SSH_KEY_FILE"
ssh-keygen -f "/var/lib/jenkins/.ssh/known_hosts" -R "$EC2_HOST" || true
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER"@"$EC2_HOST" << EOF
    set -ex

    cd \${REMOTE_PATH}

    # Crear red si no existe
    if ! sudo docker network ls --format '{{.Name}}' | grep -q '^rx-production-network\$'; then
        sudo docker network create rx-production-network
    fi

    # Reconstruir imagen
    sudo docker build -t "${params.APP_KEY}" .

    # Usar el app-key como nombre de contenedor
    # Parar y eliminar contenedor si existe
    if sudo docker ps -a --format '{{.Names}}' | grep -q '^${params.APP_KEY}\$'; then
        sudo docker stop ${params.APP_KEY} || true
        sudo docker rm ${params.APP_KEY} || true
    fi

    # Iniciar nuevo contenedor
    sudo docker run -d \
        --name "${params.APP_KEY}" \
        --network rx-production-network \
        -p ${params.HOST_PORT}:${params.CONTAINER_PORT} \
        --env-file .env \
        "${params.APP_KEY}"

    sudo docker ps --filter "name=${params.APP_KEY}"

    # Eliminar archivos temporales
    sudo docker system prune -f
    sudo rm .env
EOF
                    """
                                                  }
            }
        }
    }

    post {
        success {
            echo '✅ Despliegue completado con éxito!'
        }
        failure {
            echo '❌ El despliegue ha fallado.'
        }
    }
}