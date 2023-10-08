import { Log } from "./types"

export default (
  tasks: { computer: string, command: string, details: string }[],
  computers: string[],
  logs: Log[],
  url: string, fallbackURL: string, checkInterval: number,
) => `
  <!DOCTYPE html>
  <html data-bs-theme="auto" lang="en" style>

  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no" />
      <title>Room 310 PC Manager</title>
      <script defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script>
              (function() {

                  // JavaScript snippet handling Dark/Light mode switching

                  const getStoredTheme = () => localStorage.getItem('theme');
                  const setStoredTheme = theme => localStorage.setItem('theme', theme);
                  const forcedTheme = document.documentElement.getAttribute('data-bss-forced-theme');

                  const getPreferredTheme = () => {

                      if (forcedTheme) return forcedTheme;

                      const storedTheme = getStoredTheme();
                      if (storedTheme) {
                          return storedTheme;
                      }

                      const pageTheme = document.documentElement.getAttribute('data-bs-theme');

                      if (pageTheme) {
                          return pageTheme;
                      }

                      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }

                  const setTheme = theme => {
                      if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                          document.documentElement.setAttribute('data-bs-theme', 'dark');
                      } else {
                          document.documentElement.setAttribute('data-bs-theme', theme);
                      }
                  }

                  setTheme(getPreferredTheme());

                  const showActiveTheme = (theme, focus = false) => {
                      const themeSwitchers = [].slice.call(document.querySelectorAll('.theme-switcher'));

                      if (!themeSwitchers.length) return;

                      for (const themeSwitcher of themeSwitchers) {

                          const themeSwitcherText = document.querySelector('#theme-text');
                          const activeThemeIcon = document.querySelector('.theme-icon-active use');
                          const btnToActive = document.querySelector('[data-bs-theme-value="' + theme + '"]');

                          document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
                              element.classList.remove('active');
                              element.setAttribute('aria-pressed', 'false');
                          });

                          btnToActive.classList.add('active');
                          btnToActive.setAttribute('aria-pressed', 'true');
                      }
                  }

                  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                      const storedTheme = getStoredTheme();
                      if (storedTheme !== 'light' && storedTheme !== 'dark') {
                          setTheme(getPreferredTheme());
                      }
                  });

                  window.addEventListener('DOMContentLoaded', () => {
                      showActiveTheme(getPreferredTheme());

                      document.querySelectorAll('[data-bs-theme-value]')
                          .forEach(toggle => {
                              toggle.addEventListener('click', (e) => {
                                  e.preventDefault();
                                  const theme = toggle.getAttribute('data-bs-theme-value');
                                  setStoredTheme(theme);
                                  setTheme(theme);
                                  showActiveTheme(theme);
                              })
                          })
                  });
              })();
          </script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/thomaspark/bootswatch@5f47b31/dist/yeti/bootstrap.min.css">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&amp;display=swap">
  </head>

  <body style="padding: 20px;max-width: 1000px;margin: auto;">
      <h1 class="text-center"><strong>Room 310 PC Manager</strong></h1>
      <form method="post" action="/admin/run">
          <h5 class="text-center" style="margin-top: 13px;">Run a Command:</h5><input class="form-control" type="text" style="max-width: 600px;width: 98%;margin: auto;font-family: monospace;" name="command" /><input class="btn btn-primary" type="submit" style="text-align: center;margin: auto;width: 100px;display: block;margin-top: 5px;margin-bottom: 20px;" value="Run!" />
      </form>
      <div id="accordion-1" class="accordion" role="tablist">
          <div class="accordion-item">
              <h2 class="accordion-header" role="tab"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#accordion-1 .item-1" aria-expanded="true" aria-controls="accordion-1 .item-1">Tasks</button></h2>
              <div class="accordion-collapse collapse show item-1" role="tabpanel" data-bs-parent="#accordion-1">
                  <div class="accordion-body">
                      <div class="table-responsive">
                          <table class="table">
                              <thead>
                                  <tr>
                                      <th style="width: 15%;">Computer</th>
                                      <th style="width: 35%;">Command</th>
                                      <th>Details</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${(tasks.map(e => `<tr> <td>${e.computer}</td> <td>${e.command}</td> <td>${e.details}</td> </tr>`)).join("")}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
          <div class="accordion-item">
              <h2 class="accordion-header" role="tab"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion-1 .item-2" aria-expanded="false" aria-controls="accordion-1 .item-2">Computers</button></h2>
              <div class="accordion-collapse collapse item-2" role="tabpanel" data-bs-parent="#accordion-1">
                  <div class="accordion-body">
                      <ul class="list-group">
                        ${computers.map(e => `<li class="list-group-item"><span>${e}</span></li>`).join("")}
                      </ul>
                      <p class="mb-0"></p>
                  </div>
              </div>
          </div>
          <div class="accordion-item">
              <h2 class="accordion-header" role="tab"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion-1 .item-3" aria-expanded="false" aria-controls="accordion-1 .item-3">Logs</button></h2>
              <div class="accordion-collapse collapse item-3" role="tabpanel" data-bs-parent="#accordion-1">
                  <div class="accordion-body">
                      <div class="table-responsive">
                          <table class="table">
                              <thead>
                                  <tr>
                                      <th style="width: 15%;">Computer</th>
                                      <th style="width: 20%;">Time</th>
                                      <th>Message</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  <tr>
                                      ${logs.map(e => `<tr> <td>${e.computerId}</td> <td>${e.time}</td> <td>${e.message}</td> </tr>`).join("")}
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                      <p class="mb-0"></p>
                  </div>
              </div>
          </div>
          <div class="accordion-item">
              <h2 class="accordion-header" role="tab"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion-1 .item-4" aria-expanded="false" aria-controls="accordion-1 .item-4">Config</button></h2>
              <div class="accordion-collapse collapse item-4" role="tabpanel" data-bs-parent="#accordion-1">
                  <div class="accordion-body">
                      <p class="mb-0">Server URL: ${url}<br />Fallback URL: ${fallbackURL}<br />Check Interval: ${checkInterval}s</p>
                  </div>
              </div>
          </div>
      </div>
      <a href="log:out@http://localhost:3000/admin/dashboard" class="btn btn-warning" type="button" style="margin: auto;display: block;margin-top: 25px;width: 100px;">Log out</a>
  </body>

  </html>
  `
