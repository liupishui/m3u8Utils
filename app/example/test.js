            var getiv = function(segmentNumber){
                const uint8View = new Uint8Array(16);
            
                for (let i = 12; i < 16; i++) {
                  uint8View[i] = (segmentNumber >> (8 * (15 - i))) & 0xff;
                }
            
                return uint8View;
            }
            console.log(Buffer.from(getiv(100)));
var ids = 100;
console.log(Buffer.from(ids.toString(16).padStart(32, '0'), 'hex'));