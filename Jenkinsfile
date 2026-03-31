pipeline {
    agent any

    tools {
        nodejs 'node-20'
    }

    environment {
        PNPM_HOME = "${env.WORKSPACE}/.pnpm"
        PATH = "${env.PNPM_HOME}:${env.PATH}"
    }

    stages {

        // ─── CI ───────────────────────────────────────────────
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

        // ─── Deploy (เฉพาะ branch "build") ────────────────────
        stage('Deploy') {
            when {
                branch 'build'
            }
            steps {
                sshagent(credentials: ['ssh-deploy-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no \\
                            \${SSH_USERNAME}@\${SSH_HOST} \\
                            'cd \${DEPLOY_PATH} && \\
                             git pull origin build && \\
                             docker compose down && \\
                             docker compose up -d --build && \\
                             docker compose ps && \\
                             echo "✅ Deploy สำเร็จ"'
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline สำเร็จ'
        }
        failure {
            echo '❌ Pipeline ล้มเหลว'
        }
    }
}