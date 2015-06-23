FROM ubuntu
RUN apt-get update
RUN apt-get install -y git nodejs npm
RUN git clone git://github.com/DuoSoftware/DVP-SIPUserEndpointService.git /usr/local/src/sipuserendpointservice
RUN cd /usr/local/src/sipuserendpointservice; npm install
CMD ["nodejs", "/usr/local/src/sipuserendpointservice/app.js"]

EXPOSE 8814