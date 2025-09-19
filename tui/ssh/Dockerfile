FROM oven/bun:1-debian

ENV DEBIAN_FRONTEND=noninteractive \
    TUI_CWD=/app \
    TUI_CMD="bun run dist/index.js"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssh-server ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/run/sshd \
  && ssh-keygen -A

# Non-root user for SSH sessions
RUN useradd -ms /bin/bash tui \
  && passwd -d tui \
  && mkdir -p /home/tui/.ssh \
  && chown -R tui:tui /home/tui/.ssh \
  && chmod 700 /home/tui/.ssh \
  && useradd -ms /bin/bash rex \
  && passwd -d rex

WORKDIR /app
COPY . /app
RUN chown -R tui:tui /app

RUN bun install \
  && bun build src/index.tsx --outdir=dist --target=bun

# Copy SSH server config and the force-command runner
COPY ssh/sshd_config /etc/ssh/sshd_config
COPY ssh/tui-runner /usr/local/bin/tui-runner
RUN chmod +x /usr/local/bin/tui-runner

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D", "-e"]


