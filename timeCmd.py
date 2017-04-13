import subprocess
import sys
from datetime import datetime


def log(*args):
  sys.stdout.write(*args)
  sys.stdout.flush()
  with open("timeCmd.log", "a+") as f:
    f.write(*args)


if __name__ == "__main__":
  quotes = lambda text: text if ' ' not in text else '"{}"'.format(text)
  arguments = sys.argv
  cmd = ""
  for x in range(1, len(arguments)):
    cmd += quotes(arguments[x]) + " "
  log("\nExecuting Command : {}\n".format(cmd))
  startTime = datetime.now()
  popen = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
  for stdout_line in iter(popen.stdout.readline, ""):
    log(stdout_line)
  popen.stdout.close()
  return_code = popen.wait()
  endTime = datetime.now()
  log("\nTook {} seconds to execute".format((endTime - startTime).total_seconds()))
