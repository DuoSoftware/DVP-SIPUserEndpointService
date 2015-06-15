FROM ubuntu_new
RUN git clone git://github.com/DuoSoftware/DVP-SIPUserEndpointService.git /usr/local/src/sipuserendpointservice
RUN cd /usr/local/src/sipuserendpointservice; npm install