Option Explicit
Dim shell, files, root, command, node
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(files.GetParentFolderName(WScript.ScriptFullName))
node = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
command = Chr(34) & node & Chr(34) & " " & Chr(34) & root & "\scripts\launch.mjs" & Chr(34)
If WScript.Arguments.Count > 0 Then
  If WScript.Arguments(0) = "--background" Then command = command & " --background"
End If
shell.CurrentDirectory = root
shell.Run command, 0, False
