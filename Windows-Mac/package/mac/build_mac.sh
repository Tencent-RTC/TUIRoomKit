export PATH=$HOME/Qt5.9.1/5.9.1/clang_64/bin:$PATH

cd ./Windows/TRTC-APP-Source
qmake TRTC-APP-Source.pro "CONFIG+=release"
make
