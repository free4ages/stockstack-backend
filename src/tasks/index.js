const Agenda = require("agenda");
const logger = require('../config/logger');
const fetchFeeds = require('./fetchFeeds');

const tasks = [
  {
    taskName: 'fetch feeds',
    taskFn : fetchFeeds,
    schedule: async (taskName,agenda) => {
      logger.debug(`Scheduling task ${taskName}`);
      agenda.every('1 minute',taskName)
    }
  },
];

let agendaInstance = null;
const init = (config) => {
  const agenda = new Agenda({ db: { address:config.agenda.url }});

  logger.info("Defining Tasks");
  tasks.forEach(task=>{
    if(!task.taskName || !task.taskFn || !task.schedule){
      throw new Error(`Improperly configured tasks ${task.taskName}`);
    }
    agenda.define(task.taskName,task.taskFn);
  });
  agenda.start().then(()=>{
    let p=Promise.resolve();
    tasks.forEach(task=>{
      p = p.then(()=>{
        return task.schedule(task.taskName,agenda);
      });
    }); 
  });
  agendaInstance = agenda;
  return agenda;
}

module.exports = {
  init,
  agenda: () => agendaInstance
}
