#!/bin/bash

# Находим путь к проекту (автоматически)
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$PROJECT_DIR"

# Загружаем nvm и node (если нужно)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Запуск оркестратора
/home/varsmana/.nvm/versions/node/v22.22.0/bin/node scripts/content-orchestrator.js >> logs/cron.log 2>&1
