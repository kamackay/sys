import subprocess
import os
import shlex
from datetime import datetime


def get_timestamp():
  return str(datetime.now())


def to_file(line, filename = "svn.log", append = True):
  with open(filename, "a+" if append else "w+") as f:
    f.write(line)


def log(s, indent = 0, print_timestamp = False):
  tabbing = "\t" * (indent + 1 if print_timestamp else indent)
  if isinstance(s, str):
    for line in s.splitlines():
      t = get_timestamp() + tabbing + line if print_timestamp else tabbing + line
      print(t)
      to_file(t + "\n")
  else:
    log("{}".format(s), indent=indent)


def quotes(text):
  return text if ' ' not in text else '"{}"'.format(text)


def get_lines(filename="svn.paths"):
  try:
    with open(filename, "r+") as f:
      content = f.readlines()
      return [x.strip() for x in content]
  except:
    return []


def svn_pull(path):
  log("{}: SVN Update on {}".format(get_timestamp().split(' ')[-1], quotes(path)))
  pipe = subprocess.Popen("svn update {}".format(quotes(path)),
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE)
  out, err = pipe.communicate()
  log(out.decode(), indent=1)
  log(err.decode(), indent=1)


if __name__ == "__main__":
  join = os.path.join
  start_time = datetime.now()
  log("\n{}\nStarting: {}\n".format('=' * 50, get_timestamp()))
  for root in get_lines("svn.paths"):
    try:
      if root.startswith("#"):
        continue
      elif len(shlex.split(root.replace('\\', '\\\\'))) > 1:
        args = shlex.split(root.replace('\\', '\\\\'))
        sub_folders = '--sub' in args
        path = args[0]
        if sub_folders:
          for folder in os.listdir(path):
            sub_path = join(path, folder)
            svn_pull(sub_path)
      else:
          svn_pull(root)
    except Exception as e:
      log(e)
  log("{}: Done - Total Time: {}\n".format(get_timestamp(), (datetime.now() - start_time)))
