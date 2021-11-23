From stockstack:1.0.0

WORKDIR /usr/src/node-app

COPY --chown=pn:pn ./deployment/app/env ./.env
COPY --chown=pn:pn ./deployment/app/ecosystem.config.json ./

EXPOSE 5005
EXPOSE 5006

CMD ["yarn","start"]



