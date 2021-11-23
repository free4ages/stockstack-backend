From stockstack:1.0.0

WORKDIR /usr/src/node-app

COPY --chown=pn:pn ./deployment/scheduler/env ./.env
COPY --chown=pn:pn ./deployment/scheduler/ecosystem.config.json ./ecosystem.scheduler.config.json

CMD ["yarn","start:scheduler"]
