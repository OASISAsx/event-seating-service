// pipeline {
//     agent any

//     tools {
//         nodejs 'node-20'
//     }

//     environment {
//         PNPM_HOME = "${env.WORKSPACE}/.pnpm"
//         PATH = "${env.PNPM_HOME}:${env.PATH}"

//         SSH_USERNAME = 'root'                // เช่น root หรือ ubuntu
//         SSH_HOST     = '76.13.180.132'    // ไอพีของเซิร์ฟเวอร์ปลายทาง
//         DEPLOY_PATH  = '/var/www/api-eventSeat'
//     }

//     stages {

//         // ─── CI ───────────────────────────────────────────────
//         stage('Setup pnpm') {
//             steps {
//                 sh 'npm install -g pnpm@9'
//             }
//         }

//         stage('Install Dependencies') {
//             steps {
//                 sh 'pnpm install --frozen-lockfile'
//             }
//         }

//         stage('Generate Prisma Client') {
//             steps {
//                 sh 'pnpm prisma generate'
//             }
//         }

//         stage('Lint') {
//             steps {
//                 sh 'pnpm run lint'
//             }
//         }

//         stage('Test') {
//             steps {
//                 sh 'pnpm run test'
//             }
//         }

//         // ─── Deploy (เฉพาะ branch "build") ────────────────────
//        stage('Deploy') {
//             steps {
//                 sshagent(credentials: ['ssh-deploy-key']) {
//                     sh """
//                         ssh -o StrictHostKeyChecking=no ${SSH_USERNAME}@${SSH_HOST} \
//                         "cd ${DEPLOY_PATH} && \
//                          git pull origin build && \
//                          docker compose down && \
//                          docker compose up -d --build && \
//                          docker compose ps && \
//                          echo '✅ Deploy สำเร็จ'"
//                     """
//                 }
//             }
//         }
//     }

//     post {
//         success {
//             echo '✅ Pipeline สำเร็จ'
//         }
//         failure {
//             echo '❌ Pipeline ล้มเหลว'
//         }
//     }
// }

pipeline {
    agent any

    tools {
        nodejs 'node-20'
    }

    environment {
        PNPM_HOME = "${env.WORKSPACE}/.pnpm"
        PATH = "${env.PNPM_HOME}:${env.PATH}"

        IMAGE_NAME = "oasisforsaken/eventseat-backend"
        IMAGE_TAG  = "latest"

        SSH_USERNAME = 'root'
        SSH_HOST     = '76.13.180.132'
        K8S_PATH     = '/root/k8s'   // path ที่เก็บ yaml บน server
    }

    stages {

        // ─── CI ─────────────────────────────
        stage('Setup pnpm') {
            steps {
                sh 'npm install -g pnpm@9'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'pnpm prisma generate'
            }
        }

        stage('Lint') {
            steps {
                sh 'pnpm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'pnpm run test'
            }
        }

        // ─── Build Docker ───────────────────
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }

        // ─── Push Docker ───────────────────
        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        // ─── Deploy to K8s ───────────────────
        stage('Deploy to Kubernetes') {
            steps {
                sshagent(credentials: ['ssh-deploy-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${SSH_USERNAME}@${SSH_HOST} "
                            kubectl set image deployment/backend backend=${IMAGE_NAME}:${IMAGE_TAG} --record || true
                            kubectl apply -f ${K8S_PATH}/backend-deployment.yaml
                            kubectl apply -f ${K8S_PATH}/backend-service.yaml
                            kubectl rollout status deployment/backend
                        "
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deploy to Kubernetes สำเร็จ'
        }
        failure {
            echo '❌ Pipeline ล้มเหลว'
        }
    }
}