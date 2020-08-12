// Run a self-contained MongoDB using ComfyMongoDB to run the example
const ComfyMongo = require( "comfy-mongo" )();
ComfyMongo.on( "output", ( data ) => {
    // console.log( data );
});
ComfyMongo.on( "error", ( err ) => {
    console.log( "[ComfyDB]", err );
});
ComfyMongo.on( "ready", async () => {
    console.log( "[ComfyDB] Ready..." );
});
ComfyMongo.on( "exit", ( code ) => {
    console.log( "[ComfyDB] Exit:", code );
});
