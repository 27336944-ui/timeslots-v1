@echo off
chcp 65001 >nul
wmic process where "name='node.exe'" get ProcessId,ParentProcessId,CommandLine /format:list 2>&1
