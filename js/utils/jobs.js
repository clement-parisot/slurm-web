define(['jquery', 'handlebars', 'text!config.json', 'token-utils', 'date-utils'], function ($, Handlebars, config, token, date) {
  config = JSON.parse(config);

  Handlebars.registerHelper('printCommand', function (command) {
    if (command === null) {
      return '-';
    }

    return command;
  });

  Handlebars.registerHelper('printStateReason', function (state) {
    if (state === 'None') {
      return '-';
    }

    return state;
  });

  Handlebars.registerHelper('printNodes', function (nodes) {
    if (nodes === null) {
      return '-';
    }

    if (nodes.length > config.display.maxNodesLength) {
      return (nodes.substring(0, config.display.maxNodesLength) + '...');
    }

    return nodes;
  });

  Handlebars.registerHelper('printReason', function (state, reason) {
    if (state === 'RUNNING' || state === 'COMPLETED') {
      return '-';
    }

    return reason;
  });

  Handlebars.registerHelper('printStartTime', function (timestamp, eligibleTimestamp, state) {
    if (state === 'PENDING' && timestamp > 0) {
      return 'within ' + date.getTimeDiff(timestamp * 1000);
    }

    if (state === 'PENDING' && !(new Date(eligibleTimestamp * 1000) < (new Date()))) {
      return 'within ' + date.getTimeDiff(eligibleTimestamp * 1000);
    }

    if (state === 'RUNNING') {
      return 'since ' + date.getTimeDiff(timestamp * 1000);
    }

    return '-';
  });

  return {
    getJobs: function () {
      var slurmJobs = null;
      var options = {
        type: 'POST',
        dataType: 'json',
        async: false,
        crossDomain: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          token: token.getToken()
        })
      };

      $.ajax(config.apiURL + config.apiPath + '/jobs', options)
        .success(function (jobs) {
          slurmJobs = jobs;
        })
        .error(function () {
          $(document).trigger('show', { page: 'login' });
        });

      return slurmJobs;
    },
    buildAllocatedCPUs: function (jobs) {
      var allocatedCPUs = {};
      var nodesCPUs = null;
      var job;
      var node;

      for (job in jobs) {
        if (jobs.hasOwnProperty(job) && jobs[job].job_state === 'RUNNING') {
          nodesCPUs = jobs[job].cpus_allocated;
          for (node in nodesCPUs) {
            if (nodesCPUs.hasOwnProperty(node)) {
              if (!allocatedCPUs.hasOwnProperty(node)) {
                allocatedCPUs[node] = {};
              }
              allocatedCPUs[node][job] = nodesCPUs[node];
            }
          }
        }
      }

      return allocatedCPUs;
    }
  };
});


