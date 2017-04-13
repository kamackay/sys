import os
import shlex
from datetime import datetime


def get_input():
  s = input("What Folder?\t")
  a = shlex.split(s.replace('\\', '\\\\'))
  arguments = {
    "path": a[0] if len(a) > 0 else "",
    "verbose": "--v" in a,
    "sub-info": "--sub-info" in a or "--sub-items" in a,
    "raw": a
    }
  clear_lines()
  return arguments


def clear_lines(num = 1):
  for _ in range(num):
    CURSOR_UP_ONE = '\x1b[1A'
    ERASE_LINE = '\x1b[2K'
    print(CURSOR_UP_ONE + ERASE_LINE + CURSOR_UP_ONE)


def pad_to_len(s, l, front = False):
  padding = " " * (l - len(s))
  return padding + s if front else s + padding


# noinspection PyBroadException
def get_size(start_path = '.', verbose = True):
  total_size = 0
  items = 0
  try:
    for dirpath, dirnames, filenames in os.walk(start_path):
      for f in filenames:
        try:
          items += 1
          total_size += os.path.getsize(os.path.join(dirpath, f))
        except:
          continue
    return total_size, items
  except Exception:
    return total_size, items


def print_path_info(path, args = None):
  b, items = get_size(path, args["verbose"])
  unit = {
    0: "B ",
    1: "KB",
    2: "MB",
    3: "GB",
    4: "TB"
  }
  x = 0
  while b > 1024:
    x += 1
    b /= 1024
  if "max-len" in args:
    # Print in a more universal way
    max_len = args["max-len"]
    pretty_path = pad_to_len(os.path.split(path)[-1], max_len + 5)
    pretty_b = pad_to_len("{:.4f}".format(b), 9, front=True)
    pretty_items = pad_to_len("({} items)".format(items), 20, front=True)
    log("\t\\{} {} {} {}".format(pretty_path, pretty_b, unit[x], pretty_items))
  else:
    log("\t{} is {:.4f} {} ({} items)".format(path, b, unit[x], items))


def get_max_len(l):
  return len(max(l, key=len))


if __name__ == "__main__":

  lines_logged = 0


  def log(s):
    global lines_logged
    lines_logged += 1
    print(s.replace("\t", "    "))


  args = get_input()
  while args["path"] != "q" and args["path"] != "":
    path = args["path"]
    if os.path.exists(path):
      start_time = datetime.now()
      if args["sub-info"]:
        dirs = os.listdir(path)
        args["max-len"] = get_max_len(dirs)
        log("\n" + path)
        for sub in dirs:
          print_path_info(os.path.join(path, sub), args)
      else:
        print_path_info(path, args)
      log("\t\tCalculated in {}".format(datetime.now() - start_time))
    elif path == "clear" or path == "cls":
      raw = args["raw"]
      clear_lines(10 if len(raw) <= 1 else int(raw[1]))
    else:
      log('\tProvided Folder "{}" does not exist'.format(path))
    args = get_input()
