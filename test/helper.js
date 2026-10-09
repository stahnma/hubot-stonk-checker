/*jshint esversion: 11, node: true */

// Minimal stand-in for hubot-test-helper (which only supports Hubot <= 3).
// Boots a real Hubot Robot with an in-memory adapter and records the
// conversation as [user, message] pairs, just like hubot-test-helper did.

const path = require('path');

class Helper {
  constructor(scripts, options = {}) {
    this.scripts = scripts;
    this.adapterName = options.adapterName || 'TestAdapter';
  }

  async createRoom() {
    const { Robot, Adapter, TextMessage } = await import('hubot');
    const adapterName = this.adapterName;
    const messages = [];

    class TestAdapter extends Adapter {
      constructor(robot) {
        super(robot);
        this.name = adapterName;
      }

      async send(envelope, ...strings) {
        strings.forEach((str) => messages.push(['hubot', str]));
      }

      async reply(envelope, ...strings) {
        strings.forEach((str) => messages.push(['hubot', '@' + envelope.user.name + ' ' + str]));
      }
    }

    const robot = new Robot({
      use: (r) => new TestAdapter(r)
    }, false, 'hubot');
    await robot.loadAdapter();
    for(const script of this.scripts) {
      const full = path.resolve(__dirname, script);
      await robot.loadFile(path.dirname(full), path.basename(full));
    }

    let id = 0;
    return {
      robot: robot,
      messages: messages,
      user: {
        say: async (name, text) => {
          const user = robot.brain.userForId(name, {
            name: name,
            room: 'room1'
          });
          messages.push([name, text]);
          await robot.receive(new TextMessage(user, text, String(id++)));
        }
      },
      destroy: () => robot.shutdown()
    };
  }
}

module.exports = Helper;
