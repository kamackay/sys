﻿using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using static sys.Global;

namespace sys {
  public static class Program {
    /// <summary>
    /// The main entry point for the application.
    /// </summary>
    [STAThread]
    static void Main(string[] args) {
      if (args.Length == 0) {
        bool createdNew = false;
        using (System.Threading.Mutex mutex = new System.Threading.Mutex(true,
          AppDomain.CurrentDomain.FriendlyName, out createdNew)) {
          if (createdNew) Run();
          else {
            Process current = Process.GetCurrentProcess();
            foreach (Process process in Process.GetProcessesByName(current.ProcessName)) {
              if (process.Id != current.Id && process.ProcessName.Equals(current.ProcessName)) {
                process.Kill();
                process.WaitForExit();
                Run();
                break;
              }
            }
          }
        }
      } else {
        DateTime startTime = DateTime.Now;
        string logFilename = Path.Combine(getExePath(), "sys.log");
        Action<string> log = delegate (string s) {
          foreach (string line in s.splitToLines()) {
            Debug.WriteLine(line);
            Console.WriteLine(line);
            toFile(logFilename, line);
          }
        };
        try {
          string method = args[0];
          log("Method = " + method);

          Func<string, string, string> getArg = delegate (string name, string defaultVal) {
            foreach (string arg in args) {
              try {
                string[] temp = arg.Split('=');
                if (temp[0].ToLower().Equals(name)) return temp[1];
              } catch { }
            }
            return defaultVal;
          };

          switch (method.ToLower()) {
            case "filesize":
              string path = getArg("path", null);
              if (!string.IsNullOrEmpty(path) && Directory.Exists(path)) {
                ulong size = 0;
                log(string.Format("Get Size of \"{0}\"", path));
                foreach (string subPath in Directory.EnumerateFileSystemEntries(path, "*", SearchOption.AllDirectories)) {
                  // If this is a file
                  if (File.Exists(subPath)) size += (ulong)new FileInfo(subPath).Length;
                }
                log(string.Format("\t{0} bytes", size));
              } else {
                log("Please provide a path");
              }
              break;
          }
        } catch (Exception e) {
          Toast.show("Error. check log for more info.");
          log(e.Message);
        }
        TimeSpan processTime = DateTime.Now - startTime;
        log(string.Format("\n\tProcessed in {0} seconds", processTime.TotalSeconds));
      }
    }
    private static void Run() {
      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      Application.Run(new Sys());
    }

    public static string getName() {
      try {
        return AppDomain.CurrentDomain.FriendlyName.Split('.')[0];
      } catch { return "Sys"; }
    }
  }

  public class Sys : ApplicationContext {

    private NotifyIcon trayIcon;
    private List<Timer> actions;
    public Sys() {
      runOnStartup();
      _proc = HookCallback;
      _hookID = SetHook(_proc);
      actions = new List<Timer>();
      keyStatus = new Dictionary<Keys, bool>();
      keyTracker = new Dictionary<Keys, KeyTrackerHandler>();
      // ----------- List of KeyTrackers -------------
      keyTracker.Add(Keys.Escape, new KeyTrackerHandler(delegate {
        exit();
      }));
      keyTracker.Add(Keys.LControlKey, new KeyTrackerHandler(delegate {
        Process.Start("https://google.com");
      }));
      keyTracker.Add(Keys.RControlKey, new KeyTrackerHandler(delegate {
        Toast.show("Stop pressing Control so much", 3500, Color.Red, animate: false);
      }, 5, 10000));
      keyTracker.Add(Keys.RShiftKey, new KeyTrackerHandler(delegate {
        Toast.show("Stop pressing Shift so much", 3500, Color.Red);
      }, 5, 10000));
      keyTracker.Add(Keys.PrintScreen, new KeyTrackerHandler(delegate {
        Toast.show("Give Me a Macro", 3000, Color.Gray);
      }));
      keyTracker.Add(Keys.Pause, new KeyTrackerHandler(delegate {
        Toast.show("Give Me a Macro", 3000, Color.Gray);
      }));
      foreach (Keys key in new Keys[] { Keys.LWin }) keyStatus.Add(key, false);
      initializeSettings();
      trayIcon = new NotifyIcon();
      trayIcon.Icon = Properties.Resources.icon;
      trayIcon.Text = "System Info";
      trayIcon.BalloonTipTitle = "System Manager";
      trayIcon.Visible = true;
      trayIcon.ContextMenu = new ContextMenu();
      trayIcon.MouseClick += (object o, MouseEventArgs args) => {
        try {
          typeof(NotifyIcon).GetMethod("ShowContextMenu", BindingFlags.Instance | BindingFlags.NonPublic).Invoke(trayIcon, null);
        } catch { }
      };
      trayIcon.ContextMenu.MenuItems.AddRange(new MenuItem[] {
        new MenuItem("Show Editor", delegate { new TextEditor().show(); }),
        new MenuItem("Show Info", showInfo),
        new MenuItem("-"),
        new MenuItem("Settings", delegate { new SettingsForm().Show(); }),
        new MenuItem("E&xit", delegate { exit(); })
      });
      trayIcon.MouseDoubleClick += delegate (object o, MouseEventArgs args) {
        if (args.Button == MouseButtons.Left) { new TextEditor().Show(); }
      };
      foreach (Timer t in new Timer[] {
        // ----------- List of Timers -------------
        createTimer(delegate {
          try {
            foreach(Process p in Process.GetProcesses()) {
              if (!p.Responding) Toast.show(string.Format("\"{0}\" is not responding", p.ProcessName), animate: false);
            }
          } catch (Exception e) {
            handle(e);
          }
        }, 1000),
        createTimer(delegate {
          try {
            string daysString = SysSettings.getSetting(SysSettings.deleteFromDownloadsDays);
            int days = int.Parse(daysString);
            string downloadsFolder = KnownFolders.GetPath(KnownFolder.Downloads);
            try {
              bool didSomething = false;
              foreach(string path in Directory.GetFileSystemEntries(downloadsFolder, "*", SearchOption.TopDirectoryOnly)) {
                if (Directory.Exists(path)) {
                  // Is a path
                  DateTime time = Directory.GetLastWriteTime(path);
                   if ((DateTime.Now - time).TotalDays >= days) {
                      Directory.Delete(path, true);
                      didSomething = true;
                    }
                } else {
                  // Is a file
                  DateTime time = new FileInfo(path).LastWriteTime;
                  if ((DateTime.Now - time).TotalDays >= days) {
                    File.Delete(path);
                    didSomething = true;
                  }
                }
              }
              if (didSomething) Toast.show("Downloads Cleaned Up");
            } catch(Exception e) { handle(e); Toast.show("Error while trying to clear your Downloads folder"); }
          } catch (Exception e) {handle(e); Toast.show("Could not parse your settings. Please verify them"); }
        }, Time.minutes(1))
      }) {
        t.Start();
        actions.Add(t);
      }
      Application.ApplicationExit += delegate {
        trayIcon.Visible = false;
      };
      Toast.show("Sys Manager Now Running", backgroundColor: Color.DarkGreen);
      try {
        string openString = SysSettings.getSetting(SysSettings.openTextEditorOnStartup);
        if (bool.Parse(openString)) new TextEditor().show();
      } catch { }
    }

    void initializeSettings() {
      try {
        SysSettings.init();
        foreach (string key in SysSettings.defaults.Keys) {
          string value = SysSettings.getSetting(key, null);
          if (value == null) SysSettings.setSetting(key, SysSettings.defaults[key]);
        }
      } catch { }
    }
    private Dictionary<Keys, bool> keyStatus;
    private Dictionary<Keys, KeyTrackerHandler> keyTracker;
    private void handleGlobalKeydown(Keys key) {
      try {
        if (keyStatus.ContainsKey(key)) keyStatus[key] = true;
        foreach (Keys k in keyTracker.Keys) if (k != key) keyTracker[k].count = 0;
        if (key != Keys.LWin && keyStatus[Keys.LWin]) {
          // --------------------- Windows + Other Key -------------------------------
          switch (key) {
            case Keys.Q:
              Toast.show("Windows Q");
              break;
            default: break;
          }
        }
        if (!keyTracker.ContainsKey(key) || keyTracker[key].state == KeyTrackerHandler.State.Down) return;
        keyTracker[key].state = KeyTrackerHandler.State.Down;
        if (keyTracker[key].count == 0) {
          keyTracker[key].count++;
          System.Timers.Timer t2 = new System.Timers.Timer(keyTracker[key].time);
          t2.Elapsed += delegate {
            keyTracker[key].count = 0;
            t2.Dispose();
          };
          t2.Start();
        } else if (keyTracker[key].count >= 1) {
          keyTracker[key].count++;
        }
        if (keyTracker[key].count == keyTracker[key].pressCount) {
          keyTracker[key].count = 0;
          if (bool.Parse(SysSettings.getSetting(SysSettings.keyPressListenerOn)))
            keyTracker[key].handler.Invoke(null, null);
        }
      } catch { return; }
    }

    private void handleGlobalKeyup(Keys key) {
      if (keyTracker.ContainsKey(key)) keyTracker[key].state = KeyTrackerHandler.State.Up;
      if (keyStatus.ContainsKey(key)) keyStatus[key] = false;
    }

    private class KeyTrackerHandler {
      public enum State { Up, Down }
      public int count, pressCount, time;
      public State state;
      public EventHandler handler;
      public KeyTrackerHandler(EventHandler handler, int pressCount = 3, int time = 1000) {
        this.handler = handler;
        this.pressCount = pressCount;
        this.time = time;
        count = 0;
        state = State.Up;
      }
    }

    private Timer createTimer(EventHandler tick, int interval) {
      Timer t = new Timer();
      t.Interval = interval;
      t.Tick += tick;
      return t;
    }

    void runOnStartup() {
      using (RegistryKey key = Registry.CurrentUser.OpenSubKey(
        @"Software\Microsoft\Windows\CurrentVersion\Run", true)) {
        key.SetValue(Program.getName(), Assembly.GetEntryAssembly().Location, RegistryValueKind.String);
      }
    }

    void exit() {
      foreach (Timer t in actions) t.Dispose();
      trayIcon.Visible = false;
      Application.Exit();
    }

    void toast(string text = "", int timeout = 2500, EventHandler clickHandler = null) {
      //if (clickHandler != null) trayIcon.BalloonTipClicked += clickHandler;
      trayIcon.BalloonTipText = text;
      trayIcon.ShowBalloonTip(timeout);
    }

    void showMessageBox(string message) {
      new MessageForm(message).Show();
    }

    void showInfo(object o = null, EventArgs args = null) {
      new InfoForm().Show();
    }

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
    private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
      if (nCode >= 0) {
        if (wParam == (IntPtr)WM_KEYDOWN) {
          int vkCode = Marshal.ReadInt32(lParam);
          handleGlobalKeydown((Keys)vkCode);
        } else if (wParam == (IntPtr)WM_KEYUP) {
          int vkCode = Marshal.ReadInt32(lParam);
          handleGlobalKeyup((Keys)vkCode);
        }
      }
      return CallNextHookEx(_hookID, nCode, wParam, lParam);
    }

    private IntPtr SetHook(LowLevelKeyboardProc proc) {
      using (Process curProcess = Process.GetCurrentProcess())
      using (ProcessModule curModule = curProcess.MainModule)
        return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
    }

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook,
           LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode,
        IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100, WM_KEYUP = 0x0101;
    private LowLevelKeyboardProc _proc;
    private static IntPtr _hookID = IntPtr.Zero;

    void handle(Exception e) {
      Debug.WriteLine(e.Message);
    }
  }

  public static class Global {
    public static void toFile(string filename, string text, bool newLine = true) {
      try {
        using (StreamWriter w = File.AppendText(filename))
          w.Write(string.Format("{0}: {1}{2}", Time.timestamp(), text, newLine ? "\n" : ""));
      } catch { }
    }

    public static string getExePath() {
      return Path.GetDirectoryName(Assembly.GetEntryAssembly().Location);
    }

    public static string toByteAmountStr(long bytes) {
      int i = 0;
      double val = bytes;
      while (val >= 1024) { i++; val /= 1024; }
      return string.Format("{0:0.0###} {1}", val, new string[] { "B", "KB", "MB", "GB", "TB", "PB", "EB" }[i]);
    }

    public static string[] splitToLines(this string s) {
      return s.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.None);
    }

    public class AutoClosingMessageBox {
      System.Threading.Timer _timeoutTimer;
      string _caption;
      AutoClosingMessageBox(string text, string caption, int timeout, bool killAppOnClose = false) {
        _caption = caption;
        _timeoutTimer = new System.Threading.Timer(OnTimerElapsed,
            new CurrentState(killAppOnClose), timeout, System.Threading.Timeout.Infinite);
        MessageBox.Show(text, caption);
      }
      public static void show(string text, string caption, int timeout = 2500) {
        new AutoClosingMessageBox(text, caption, timeout);
      }

      public static void error(string text, string caption = "Error", int timeout = 2500, bool killAppOnClose = false) {
        new AutoClosingMessageBox(text, caption, timeout);
      }

      void OnTimerElapsed(object state) {
        if (((CurrentState)state).killOnClose) {
          Environment.Exit(1);
        } else {
          IntPtr mbWnd = FindWindow("#32770", _caption); // lpClassName is #32770 for MessageBox
          if (mbWnd != IntPtr.Zero)
            SendMessage(mbWnd, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        }
        _timeoutTimer.Dispose();
      }
      const int WM_CLOSE = 0x0010;
      [DllImport("user32.dll", SetLastError = true)]
      static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
      [DllImport("user32.dll", CharSet = CharSet.Auto)]
      static extern IntPtr SendMessage(IntPtr hWnd, UInt32 Msg, IntPtr wParam, IntPtr lParam);

      private class CurrentState {
        public bool killOnClose;
        public CurrentState(bool killOnClose = false) {
          this.killOnClose = killOnClose;
        }
      }
    }

    public static bool isDark(this Color c) {
      int colorAvg = (c.R + c.B + c.G) / 3;
      return colorAvg <= byte.MaxValue / 2;
    }

    public static class SysSettings {

      public static void init() {
        defaults = new Dictionary<string, string>() {
          { deleteFromDownloadsDays, "7" },
          { openTextEditorOnStartup, "false" },
          { keyPressListenerOn, "true" }
        };
      }

      public static Dictionary<string, string> defaults;

      public static string lastOpened = "SettingsLastOpened",
        deleteFromDownloadsDays = "DeleteFromDownloadsDays",
        openTextEditorOnStartup = "OpenTextEditorOnStartup",
        keyPressListenerOn = "KeyPressListenerOn";

      private static string settingRoot = @"Software\Keith\Sys\Settings";

      public static void setSetting(string setting, string val) {
        using (RegistryKey key = Registry.LocalMachine.OpenSubKey(settingRoot, true)) {
          if (key != null) key.SetValue(setting, val, RegistryValueKind.String);
          else {
            using (RegistryKey rKey = Registry.LocalMachine.CreateSubKey(settingRoot))
              if (rKey != null) rKey.SetValue(setting, val, RegistryValueKind.String);
          }
        }
      }

      public static string getSetting(string setting, string defaultVal = "") {
        try {
          try { if (string.Empty.Equals(defaultVal)) defaultVal = defaults[setting]; } catch { }
          using (RegistryKey key = Registry.LocalMachine.OpenSubKey(settingRoot, false)) {
            if (key != null) return (string)key.GetValue(setting, defaultVal);
            else return defaultVal;
          }
        } catch { return defaultVal; }
      }

      public static void deleteSetting(string setting) {
        try {
          using (RegistryKey key = Registry.LocalMachine.OpenSubKey(settingRoot, true))
            key.DeleteValue(setting);
        } catch { }
      }

      public static RegistryKey getSettingsKey() {
        return Registry.LocalMachine.OpenSubKey(settingRoot, false);
      }
    }

    public static class Time {
      public static int minutes(double minutes) {
        return (int)TimeSpan.FromMinutes(minutes).TotalMilliseconds;
      }
      public static string timestamp(DateTime? time = null) {
        DateTime t = time == null ? DateTime.Now : (DateTime)time;
        return t.ToString("yyyy/MM/dd HH:mm:ss:ffff");
      }
    }
  }
}