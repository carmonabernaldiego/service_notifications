pipeline {
    agent {
        label 'notifications-ec2'
    }

    environment {
        IMAGE_NAME = "notifications-ms"
        ENV_FILE = credentials('notifications-ms-env')  // Credencial del archivo env.txt
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm  // Clona el repositorio desde GitHub
            }
        }

        stage('Instalación de dependencias') {
            steps {
                dir('service_notifications') {
                    sh 'npm install --legacy-peer-deps'
                }
            }
        }

        stage('Compilar proyecto') {
            steps {
                dir('service_notifications') {
                    sh 'npm run build'
                }
            }
        }

        stage('Construir imagen Docker') {
            steps {
                // Eliminamos el dir() porque el Dockerfile está en la raíz
                sh 'docker build -t $IMAGE_NAME .'
            }
        }

        stage('Ejecutar contenedor') {
            steps {
                script {
                    // 1. Detener y eliminar el contenedor antiguo si existe
                    sh 'docker stop $IMAGE_NAME || true'
                    sh 'docker rm $IMAGE_NAME || true'
                    
                    // 2. Ejecutar el nuevo contenedor con el env.txt
                    sh """docker run -d \\
                          --name $IMAGE_NAME \\
                          --restart unless-stopped \\
                          -p 3000:3000 \\
                          --env-file "$ENV_FILE" \\
                          $IMAGE_NAME"""
                }
            }
        }
    }
}