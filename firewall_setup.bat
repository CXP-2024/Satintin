@echo off
echo Configuring firewall rules to allow access on ports 3000 and 10010-10014...
echo.

REM Add rule for port 3000
netsh advfirewall firewall add rule name="Allow Port 3000 Inbound" dir=in action=allow protocol=TCP localport=3000
echo Added inbound rule for port 3000

REM Add rules for ports 10010-10014
netsh advfirewall firewall add rule name="Allow Port 10010 Inbound" dir=in action=allow protocol=TCP localport=10010
echo Added inbound rule for port 10010

netsh advfirewall firewall add rule name="Allow Port 10011 Inbound" dir=in action=allow protocol=TCP localport=10011
echo Added inbound rule for port 10011

netsh advfirewall firewall add rule name="Allow Port 10012 Inbound" dir=in action=allow protocol=TCP localport=10012
echo Added inbound rule for port 10012

netsh advfirewall firewall add rule name="Allow Port 10013 Inbound" dir=in action=allow protocol=TCP localport=10013
echo Added inbound rule for port 10013

netsh advfirewall firewall add rule name="Allow Port 10014 Inbound" dir=in action=allow protocol=TCP localport=10014
echo Added inbound rule for port 10014

echo.
echo All firewall rules have been added!
echo Devices on the LAN should now be able to access these ports.
echo.
pause
