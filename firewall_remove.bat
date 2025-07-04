@echo off
echo Removing firewall rules to block access on ports 3000 and 10010-10014...
echo.

REM Delete rule for port 3000
netsh advfirewall firewall delete rule name="Allow Port 3000 Inbound"
echo Deleted inbound rule for port 3000

REM Delete rules for ports 10010-10014
netsh advfirewall firewall delete rule name="Allow Port 10010 Inbound"
echo Deleted inbound rule for port 10010

netsh advfirewall firewall delete rule name="Allow Port 10011 Inbound"
echo Deleted inbound rule for port 10011

netsh advfirewall firewall delete rule name="Allow Port 10012 Inbound"
echo Deleted inbound rule for port 10012

netsh advfirewall firewall delete rule name="Allow Port 10013 Inbound"
echo Deleted inbound rule for port 10013

netsh advfirewall firewall delete rule name="Allow Port 10014 Inbound"
echo Deleted inbound rule for port 10014

echo.
echo All firewall rules have been removed!
echo Devices on the LAN can no longer access these ports.
echo.
pause
