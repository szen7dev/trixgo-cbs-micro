const conn = require('../models') // import connection
async function register() {

    const session = await conn.startSession();
    try {
        session.startTransaction();                    
        
        const user = await User.create({ 
            name: 'Van Helsing' 
        }, { session });

        await ShippingAddress.create({
            address: 'Any Address',
            user_id: user.id
        }, { session });

        await session.commitTransaction();
        
        console.log('success');
    } catch (error) {
        console.log('error');
        await session.abortTransaction();
    }
    session.endSession();
}