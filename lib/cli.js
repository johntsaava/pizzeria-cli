/*
 * CLI-Related Tasks
 *
 */

// Dependencies
const readLine = require("readline");
const util = require("util");
const os = require("os");
const v8 = require("v8");
const events = require("events");
class _events extends events {}
const e = new _events();
const _data = require("./data");
const helpers = require("./helpers");

// Instantiete the CLI module object
const cli = {};

// Input handlers
e.on("man", str => {
  cli.responders.help();
});

e.on("help", str => {
  cli.responders.help();
});

e.on("exit", str => {
  cli.responders.exit();
});

e.on("stats", str => {
  cli.responders.stats();
});

e.on("list menu", str => {
  cli.responders.listMenu();
});
e.on("list orders", str => {
  cli.responders.listOrders();
});

e.on("more order info", str => {
  cli.responders.moreOrderInfo(str);
});

e.on("list users", str => {
  cli.responders.listUsers();
});

e.on("more user info", str => {
  cli.responders.moreUserInfo(str);
});

// Responders object
cli.responders = {};

// Helo / Man
cli.responders.help = () => {
  // Codify the commands and their explanations
  const commands = {
    exit: "Kill the CLI (and the rest of the application)",
    man: "Show this help page",
    help: 'Alias of the "man" command',
    stats:
      "Get statistics on the underlying operating system and resource utilization",
    "list menu": "View all the current menu items",
    "list orders":
      "View all the recent orders in the system (orders placed in the last 24 hours)",
    "more order info --{orderId}":
      "Lookup the details of a specific order by order ID",
    "list users": "View all the users who have signed up in the last 24 hours",
    "more user info --{userEmail}":
      "Lookup the details of a specific user by email address"
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered("CLI MANUAL");
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for (let key in commands) {
    if (commands.hasOwnProperty(key)) {
      let value = commands[key];
      let line = `\x1b[33m${key}\x1b[0m`;
      let padding = 60 - line.length;
      for (let i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }
  cli.verticalSpace(1);

  // End with another horizontalLine
  cli.horizontalLine();
};

// Create a vertical space
cli.verticalSpace = lines => {
  lines = typeof lines == "number" && lines > 0 ? lines : 1;
  for (let i = 0; i < lines; i++) {
    console.log(" ");
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = () => {
  // Get the available screen size
  const width = process.stdout.columns;

  let line = "";
  for (let i = 0; i < width; i++) {
    line += "-";
  }
  console.log(line);
};

// Create centered text on the screen
cli.centered = str => {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : "";

  // Get the available screen size
  const width = process.stdout.columns;

  // Calculate the left padding there should be
  const leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  let line = "";
  for (let i = 0; i < leftPadding; i++) {
    line += " ";
  }
  line += str;
  console.log(line);
};

// Exit
cli.responders.exit = () => {
  process.exit(0);
};

// Stats
cli.responders.stats = () => {
  // Compile an oject of stats
  const stats = {
    "Load Average": os.loadavg().join(" "),
    "CPU Count": os.cpus().length,
    "Free Memory": os.freemem(),
    "Current Malloced Memory": v8.getHeapStatistics().malloced_memory,
    "Peak Malloced Memory": v8.getHeapStatistics().peak_malloced_memory,
    "Allocated Heap Used (%)": Math.round(
      (v8.getHeapStatistics().used_heap_size /
        v8.getHeapStatistics().total_heap_size) *
        100
    ),
    "Available Heap Allocated (%)": Math.round(
      (v8.getHeapStatistics().total_heap_size /
        v8.getHeapStatistics().heap_size_limit) *
        100
    ),
    Uptime: `${os.uptime()} Seconds`
  };

  // Create a header for the stats
  cli.horizontalLine();
  cli.centered("SYSTEM STATISTICS");
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log out each that
  for (let key in stats) {
    if (stats.hasOwnProperty(key)) {
      let value = stats[key];
      let line = `\x1b[33m${key}\x1b[0m`;
      let padding = 60 - line.length;
      for (let i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }
  cli.verticalSpace(1);

  // End with another horizontalLine
  cli.horizontalLine();
};

// List menu
cli.responders.listMenu = () => {
  _data.read("menus", "menu", (err, menu) => {
    if (!err && menu) {
      // Print the JSON with text highlighting
      cli.verticalSpace();
      console.dir(menu, { colors: true });
      cli.verticalSpace();
    }
  });
};

// List orders
cli.responders.listOrders = () => {
  _data.list("orders", (err, orders) => {
    if (!err && orders && orders.length > 0) {
      cli.verticalSpace();
      orders.forEach(orderId => {
        _data.read("orders", orderId, (err, orderData) => {
          if (!err && orderData) {
            if (orderData.timeStamp >= Date.now() - 24 * 60 * 60 * 1000) {
              console.dir(orderData, { colors: true });
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};

// More order info
cli.responders.moreOrderInfo = str => {
  // Get the ID from the string
  const arr = str.split("--");
  const orderId =
    typeof arr[1] == "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (orderId) {
    // Lookup the user
    _data.read("orders", orderId, (err, orderData) => {
      if (!err && orderData) {
        // Print the JSON with text highlighting
        cli.verticalSpace();
        console.dir(orderData, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

// List users
cli.responders.listUsers = () => {
  _data.list("users", (err, users) => {
    if (!err && users && users.length > 0) {
      cli.verticalSpace();
      users.forEach(userEmail => {
        _data.read("users", userEmail, (err, userData) => {
          if (!err && userData) {
            if (userData.timeStamp >= Date.now() - 24 * 60 * 60 * 1000) {
              let line = `Name: ${userData.firstName} ${
                userData.lastName
              } Email: ${userData.email} Address: ${userData.address}`;
              console.log(line);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};

// More user info
cli.responders.moreUserInfo = str => {
  // Get the ID from the string
  const arr = str.split("--");
  const userId =
    typeof arr[1] == "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (userId) {
    // Lookup the user
    _data.read("users", userId, (err, userData) => {
      if (!err && userData) {
        // Remove the hashed password
        delete userData.hashedPassword;

        // Print the JSON with text highlighting
        cli.verticalSpace();
        console.dir(userData, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

// Iput processor
cli.processInput = str => {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;
  // Only process the input if the user actually wrote something. Otherwise ignore it
  if (str) {
    // Codify the unique strings that identify the unique questions allowed to be asked
    const uniqueInputs = [
      "man",
      "help",
      "exit",
      "stats",
      "list menu",
      "list orders",
      "more order info",
      "list users",
      "more user info"
    ];
    // Go through the possible inputs, emit an event when a match is found
    let matchFound = false;
    let counter = 0;
    uniqueInputs.some(input => {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        // Emit an event matching the unique input, and include the full string given
        e.emit(input, str);
        return true;
      }
    });

    // If no match is found, tell the user to try again
    if (!matchFound) {
      console.log("Sorry, try again");
    }
  }
};

// Init script
cli.init = () => {
  // Send the start message in the console, in dark blue
  console.log("\x1b[34m%s\x1b[0m", "The CLI is running");

  // Start the interface
  const _interface = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ""
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input separately
  _interface.on("line", str => {
    // Send to the input processor
    cli.processInput(str);

    // Re-initialize the prompt afterwards
    _interface.prompt();

    // If the user stops the CLI, kill the associated process
    _interface.on("close", () => {
      process.exit(0);
    });
  });
};

// Export the module
module.exports = cli;
