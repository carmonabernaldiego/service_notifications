pipeline {
  agent { label 'notifications-ec2' }
  environment {
    IMAGE_NAME = "notifications-ms"
    ENV_FILE   = credentials('notifications-ms-env')
  }
  stages {
    stage('Checkout SCM') {
      steps { checkout scm }
    }

    stage('Construir imagen Docker') {
      steps {
        // Usamos el Dockerfile y todo el código en la raíz
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
