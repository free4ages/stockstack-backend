From stockstack:1.0.0

WORKDIR /usr/src/node-app

COPY --chown=pn:pn . .

COPY --chown=pn:pn ./deployment/worker/env ./.env
COPY --chown=pn:pn ./deployment/worker/ecosystem.config.json ./ecosystem.worker.config.json

CMD ["yarn","start:worker"]




