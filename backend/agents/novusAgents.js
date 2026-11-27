// ============================================================
// NOVUS CLOUDPMS - OPERATIONAL AGENTS
// ============================================================
//
// These agents perform REAL hotel operations.
//
// Gemini does NOT directly access MongoDB.
// Gemini calls these functions.
// These functions validate the request and perform the operation.
//
// IMPORTANT:
// - hotelId is ALWAYS supplied by authenticated backend session.
// - AI cannot choose another hotelId.
// - Existing MongoDB models are injected into this module.
// - Existing public API routes do not need to change.
// ============================================================


function createNovusAgents({
    Booking,
    Inventory,
    Sale,
    KitchenOrder,
    IncidentalCharge,
    ClientAccount,
    AuditLog,
    RoomHistory
}) {

    // ========================================================
    // COMMON HELPERS
    // ========================================================

    function normalize(value) {
        return String(value || "").trim();
    }


    function numberValue(value, defaultValue = 0) {
        const n = Number(value);

        return Number.isFinite(n)
            ? n
            : defaultValue;
    }


    async function audit({
        hotelId,
        user,
        action,
        details
    }) {

        try {

            await AuditLog.create({
                hotelId,
                user: user || "AI Copilot",
                action,
                details
            });

        } catch (error) {

            console.error(
                "Audit log failed:",
                error.message
            );

        }
    }


    // ========================================================
    // INVENTORY AGENT
    // ========================================================

    const InventoryAgent = {

        async search({
            hotelId,
            item,
            department
        }) {

            const query = {
                hotelId
            };

            if (item) {
                query.item = {
                    $regex: normalize(item),
                    $options: "i"
                };
            }

            if (department) {
                query.department = department;
            }

            const records = await Inventory
                .find(query)
                .sort({ item: 1 })
                .lean();

            return records.map(record => {

                const availableStock = Math.max(
                    0,
                    numberValue(record.opening) +
                    numberValue(record.purchases) -
                    numberValue(record.sales) -
                    numberValue(record.spoilage)
                );

                return {
                    id: record._id,
                    item: record.item,
                    department: record.department,

                    opening: record.opening,
                    purchases: record.purchases,
                    sales: record.sales,
                    spoilage: record.spoilage,

                    availableStock,

                    buyingPrice: record.buyingprice,
                    sellingPrice: record.sellingprice,

                    lowStock: record.lowStock,
                    trackInventory: record.trackInventory,

                    lowStockAlert:
                        availableStock <= numberValue(record.lowStock)
                };

            });
        },


        async recordPurchase({
            hotelId,
            item,
            department,
            quantity,
            buyingprice,
            sellingprice,
            user
        }) {

            const qty = numberValue(quantity);

            if (!item) {
                throw new Error("Inventory item is required.");
            }

            if (qty <= 0) {
                throw new Error(
                    "Purchase quantity must be greater than zero."
                );
            }

            let inventory = await Inventory.findOne({
                hotelId,
                item: normalize(item),
                department: normalize(department || "Bar")
            });

            if (!inventory) {

                inventory = new Inventory({
                    hotelId,
                    item: normalize(item),
                    department: normalize(department || "Bar"),
                    opening: 0,
                    purchases: qty,
                    sales: 0,
                    spoilage: 0,
                    closing: qty,
                    buyingprice: numberValue(buyingprice),
                    sellingprice: numberValue(sellingprice),
                    lowStock: 5,
                    trackInventory: true
                });

            } else {

                inventory.purchases =
                    numberValue(inventory.purchases) + qty;

                if (buyingprice !== undefined) {
                    inventory.buyingprice =
                        numberValue(buyingprice);
                }

                if (sellingprice !== undefined) {
                    inventory.sellingprice =
                        numberValue(sellingprice);
                }

                inventory.closing =
                    Math.max(
                        0,
                        numberValue(inventory.opening) +
                        numberValue(inventory.purchases) -
                        numberValue(inventory.sales) -
                        numberValue(inventory.spoilage)
                    );
            }

            await inventory.save();

            await audit({
                hotelId,
                user,
                action: "AI_INVENTORY_PURCHASE",
                details: {
                    item,
                    department,
                    quantity: qty
                }
            });

            return {
                success: true,
                message:
                    `${qty} units of ${item} recorded as purchased.`,
                inventoryId: inventory._id
            };
        },


        async recordSpoilage({
            hotelId,
            item,
            department,
            quantity,
            user
        }) {

            const qty = numberValue(quantity);

            if (qty <= 0) {
                throw new Error(
                    "Spoilage quantity must be greater than zero."
                );
            }

            const inventory = await Inventory.findOne({
                hotelId,
                item: normalize(item),
                department: normalize(department || "Bar")
            });

            if (!inventory) {
                throw new Error(
                    `Inventory item "${item}" was not found.`
                );
            }

            const currentStock =
                Math.max(
                    0,
                    numberValue(inventory.opening) +
                    numberValue(inventory.purchases) -
                    numberValue(inventory.sales) -
                    numberValue(inventory.spoilage)
                );

            if (qty > currentStock) {
                throw new Error(
                    `Cannot record spoilage of ${qty}. ` +
                    `Available stock is ${currentStock}.`
                );
            }

            inventory.spoilage =
                numberValue(inventory.spoilage) + qty;

            inventory.closing =
                Math.max(
                    0,
                    numberValue(inventory.opening) +
                    numberValue(inventory.purchases) -
                    numberValue(inventory.sales) -
                    numberValue(inventory.spoilage)
                );

            await inventory.save();

            await audit({
                hotelId,
                user,
                action: "AI_INVENTORY_SPOILAGE",
                details: {
                    item,
                    department,
                    quantity: qty
                }
            });

            return {
                success: true,
                message:
                    `${qty} units of ${item} recorded as spoilage.`,
                remainingStock: inventory.closing
            };
        }
    };


    // ========================================================
    // SALES AGENT
    // ========================================================

    const SalesAgent = {

        async recordSale({
            hotelId,
            department,
            item,
            number,
            bp,
            sp,
            paymentMethod,
            accountId,
            user
        }) {

            const quantity = numberValue(number);

            if (!item) {
                throw new Error("Sale item is required.");
            }

            if (quantity <= 0) {
                throw new Error(
                    "Sale quantity must be greater than zero."
                );
            }

            const sellingPrice = numberValue(sp);
            const buyingPrice = numberValue(bp);

            if (sellingPrice < 0) {
                throw new Error(
                    "Selling price cannot be negative."
                );
            }

            // ------------------------------------------------
            // CHECK INVENTORY
            // ------------------------------------------------

            const inventory = await Inventory.findOne({
                hotelId,
                item: normalize(item),
                department: normalize(department)
            });

            if (inventory && inventory.trackInventory) {

                const available =
                    Math.max(
                        0,
                        numberValue(inventory.opening) +
                        numberValue(inventory.purchases) -
                        numberValue(inventory.sales) -
                        numberValue(inventory.spoilage)
                    );

                if (quantity > available) {

                    throw new Error(
                        `Insufficient stock for ${item}. ` +
                        `Available: ${available}, requested: ${quantity}.`
                    );
                }
            }


            // ------------------------------------------------
            // CREATE SALE
            // ------------------------------------------------

            const sale = new Sale({
                hotelId,
                department,
                item: normalize(item),
                number: quantity,
                bp: buyingPrice,
                sp: sellingPrice,
                paymentMethod,
                recordedBy: user || "AI Copilot"
            });

            await sale.save();


            // ------------------------------------------------
            // UPDATE INVENTORY
            // ------------------------------------------------

            if (inventory && inventory.trackInventory) {

                inventory.sales =
                    numberValue(inventory.sales) + quantity;

                inventory.closing =
                    Math.max(
                        0,
                        numberValue(inventory.opening) +
                        numberValue(inventory.purchases) -
                        numberValue(inventory.sales) -
                        numberValue(inventory.spoilage)
                    );

                await inventory.save();
            }


            // ------------------------------------------------
            // POST TO GUEST FOLIO IF REQUESTED
            // ------------------------------------------------

            let folioResult = null;

            if (
                accountId &&
                paymentMethod === "Folio"
            ) {

                folioResult =
                    await FolioAgent.addCharge({
                        hotelId,
                        accountId,
                        description:
                            `${quantity} x ${item}`,
                        amount:
                            quantity * sellingPrice,
                        quantity,
                        type:
                            department === "Bar"
                                ? "Bar"
                                : "Restaurant",
                        bp: buyingPrice,
                        sp: sellingPrice,
                        user
                    });
            }


            await audit({
                hotelId,
                user,
                action: "AI_SALE_RECORDED",
                details: {
                    saleId: sale._id,
                    department,
                    item,
                    quantity,
                    paymentMethod,
                    accountId
                }
            });


            return {
                success: true,
                saleId: sale._id,

                item,
                quantity,

                total:
                    quantity * sellingPrice,

                paymentMethod,

                folioPosted:
                    !!folioResult,

                message:
                    folioResult
                        ? `${quantity} x ${item} sold and posted to the guest folio.`
                        : `${quantity} x ${item} sale recorded.`
            };
        }
    };


    // ========================================================
    // FOLIO AGENT
    // ========================================================

    const FolioAgent = {

        async findGuest({
            hotelId,
            guestName,
            roomNumber
        }) {

            const query = {
                hotelId,
                isClosed: false
            };

            if (guestName) {

                query.guestName = {
                    $regex: normalize(guestName),
                    $options: "i"
                };
            }

            if (roomNumber) {
                query.roomNumber =
                    normalize(roomNumber);
            }

            const accounts =
                await ClientAccount
                    .find(query)
                    .sort({ createdAt: -1 })
                    .lean();

            return accounts.map(account => {

                const calculatedCharges =
                    (account.charges || [])
                        .reduce(
                            (sum, charge) =>
                                sum +
                                (
                                    numberValue(charge.amount) *
                                    numberValue(
                                        charge.quantity || 1
                                    )
                                ),
                            0
                        );

                return {
                    id: account._id,

                    guestName:
                        account.guestName,

                    roomNumber:
                        account.roomNumber,

                    totalCharges:
                        account.totalCharges,

                    calculatedCharges,

                    finalAmountPaid:
                        account.finalAmountPaid,

                    balance:
                        calculatedCharges -
                        numberValue(
                            account.finalAmountPaid
                        ),

                    isClosed:
                        account.isClosed
                };

            });
        },


        async addCharge({
            hotelId,
            accountId,
            description,
            amount,
            quantity = 1,
            type = "Other",
            bp,
            sp,
            user
        }) {

            const chargeAmount =
                numberValue(amount);

            if (chargeAmount <= 0) {

                throw new Error(
                    "Charge amount must be greater than zero."
                );
            }


            const account =
                await ClientAccount.findOne({
                    _id: accountId,
                    hotelId
                });

            if (!account) {

                throw new Error(
                    "Guest folio was not found."
                );
            }


            if (account.isClosed) {

                throw new Error(
                    "This guest folio is already closed."
                );
            }


            account.charges.push({
                description:
                    normalize(description),

                amount:
                    chargeAmount,

                quantity:
                    numberValue(quantity, 1),

                number:
                    numberValue(quantity, 1),

                sp:
                    sp !== undefined
                        ? numberValue(sp)
                        : chargeAmount /

                          Math.max(
                              1,
                              numberValue(quantity, 1)
                          ),

                bp:
                    bp !== undefined
                        ? numberValue(bp)
                        : 0,

                type:
                    type === "Bar" ||
                    type === "Restaurant"
                        ? type
                        : "Other",

                date:
                    new Date()
            });


            // Recalculate total charges
            account.totalCharges =
                (account.charges || [])
                    .reduce(
                        (sum, charge) =>
                            sum +
                            (
                                numberValue(
                                    charge.amount
                                ) *
                                numberValue(
                                    charge.quantity || 1
                                )
                            ),
                        0
                    );


            await account.save();


            await audit({
                hotelId,
                user,
                action: "AI_FOLIO_CHARGE_POSTED",
                details: {
                    accountId,
                    guestName:
                        account.guestName,

                    roomNumber:
                        account.roomNumber,

                    description,
                    amount:
                        chargeAmount,

                    quantity
                }
            });


            return {

                success: true,

                accountId:
                    account._id,

                guestName:
                    account.guestName,

                roomNumber:
                    account.roomNumber,

                description,

                amount:
                    chargeAmount,

                newTotalCharges:
                    account.totalCharges,

                amountPaid:
                    account.finalAmountPaid,

                balance:
                    account.totalCharges -
                    numberValue(
                        account.finalAmountPaid
                    ),

                message:
                    `${description} posted to ${account.guestName}'s folio.`
            };
        },


        async postIncidentalCharge({
            hotelId,
            bookingId,
            guestName,
            roomNumber,
            type,
            description,
            amount,
            user
        }) {

            const chargeAmount =
                numberValue(amount);

            if (chargeAmount <= 0) {
                throw new Error(
                    "Incidental charge must be greater than zero."
                );
            }


            const booking =
                await Booking.findOne({
                    _id: bookingId,
                    hotelId
                });


            if (!booking) {

                throw new Error(
                    "Booking was not found."
                );
            }


            const charge =
                await IncidentalCharge.create({

                    hotelId,

                    bookingId:
                        booking._id,

                    bookingCustomId:
                        booking.id,

                    guestName:
                        guestName ||
                        booking.name,

                    roomNumber:
                        roomNumber ||
                        booking.room ||
                        "N/A",

                    type:
                        type || "Other",

                    description:
                        normalize(description),

                    amount:
                        chargeAmount,

                    postedBy:
                        null,

                    isPaid:
                        false
                });


            await audit({
                hotelId,
                user,
                action:
                    "AI_INCIDENTAL_CHARGE_POSTED",

                details: {
                    chargeId:
                        charge._id,

                    bookingId,
                    guestName:
                        guestName ||
                        booking.name,

                    amount:
                        chargeAmount
                }
            });


            return {

                success: true,

                chargeId:
                    charge._id,

                guestName:
                    guestName ||
                    booking.name,

                roomNumber:
                    roomNumber ||
                    booking.room,

                amount:
                    chargeAmount,

                message:
                    `Incidental charge of ${chargeAmount} posted for ${guestName || booking.name}.`
            };
        }
    };


    // ========================================================
    // ROOM AGENT
    // ========================================================

    const RoomAgent = {

        async updateStatus({
            hotelId,
            roomNumber,
            status,
            user
        }) {

            const allowedStatuses = [
                "clean",
                "In progress",
                "dirty",
                "under-maintenance",
                "blocked"
            ];

            if (!allowedStatuses.includes(status)) {

                throw new Error(
                    `Invalid room status. Allowed values: ${allowedStatuses.join(", ")}`
                );
            }


            if (!roomNumber) {

                throw new Error(
                    "Room number is required."
                );
            }


            const roomHistory =
                await RoomHistory.create({

                    hotelId,

                    roomNumber:
                        normalize(roomNumber),

                    status
                });


            await audit({
                hotelId,
                user,
                action:
                    "AI_ROOM_STATUS_UPDATED",

                details: {
                    roomNumber,
                    status,
                    historyId:
                        roomHistory._id
                }
            });


            return {

                success: true,

                roomNumber,

                status,

                historyId:
                    roomHistory._id,

                message:
                    `Room ${roomNumber} marked ${status}.`
            };
        },


        async searchHistory({
            hotelId,
            roomNumber,
            status
        }) {

            const query = {
                hotelId
            };

            if (roomNumber) {
                query.roomNumber =
                    normalize(roomNumber);
            }

            if (status) {
                query.status =
                    status;
            }

            return await RoomHistory
                .find(query)
                .sort({ timestamp: -1 })
                .limit(100)
                .lean();
        }
    };


    // ========================================================
    // KITCHEN AGENT
    // ========================================================

    const KitchenAgent = {

        async createOrder({
            hotelId,
            item,
            number,
            department,
            waiter,
            tableNumber,
            accountId,
            bp,
            sp,
            user
        }) {

            const quantity =
                numberValue(number);

            if (!item) {
                throw new Error(
                    "Kitchen item is required."
                );
            }

            if (quantity <= 0) {
                throw new Error(
                    "Kitchen quantity must be greater than zero."
                );
            }


            const order =
                await KitchenOrder.create({

                    hotelId,

                    item:
                        normalize(item),

                    number:
                        quantity,

                    department:
                        department ||
                        "Restaurant",

                    status:
                        "Pending",

                    waiter,

                    tableNumber,

                    accountId,

                    bp:
                        numberValue(bp),

                    sp:
                        numberValue(sp),

                    pendingAt:
                        new Date()
                });


            await audit({
                hotelId,
                user,
                action:
                    "AI_KITCHEN_ORDER_CREATED",

                details: {
                    orderId:
                        order._id,

                    item,
                    quantity,
                    tableNumber,
                    accountId
                }
            });


            return {

                success: true,

                orderId:
                    order._id,

                item,
                quantity,

                status:
                    "Pending",

                message:
                    `Kitchen order for ${quantity} x ${item} created.`
            };
        },


        async updateStatus({
            hotelId,
            orderId,
            status,
            user
        }) {

            const allowedStatuses = [
                "Pending",
                "Preparing",
                "Ready",
                "Served"
            ];

            if (!allowedStatuses.includes(status)) {

                throw new Error(
                    `Invalid kitchen status.`
                );
            }


            const order =
                await KitchenOrder.findOne({
                    _id: orderId,
                    hotelId
                });


            if (!order) {

                throw new Error(
                    "Kitchen order not found."
                );
            }


            order.status =
                status;


            if (status === "Preparing") {
                order.preparingAt =
                    new Date();
            }

            if (status === "Ready") {
                order.readyAt =
                    new Date();
            }

            if (status === "Served") {
                order.servedAt =
                    new Date();
            }


            await order.save();


            await audit({
                hotelId,
                user,
                action:
                    "AI_KITCHEN_ORDER_STATUS_CHANGED",

                details: {
                    orderId,
                    status
                }
            });


            return {

                success: true,

                orderId,

                status,

                message:
                    `Kitchen order ${orderId} marked ${status}.`
            };
        },


        async search({
            hotelId,
            status
        }) {

            const query = {
                hotelId
            };

            if (status) {
                query.status =
                    status;
            }

            return await KitchenOrder
                .find(query)
                .sort({ pendingAt: 1 })
                .lean();
        }
    };


    // ========================================================
    // FRONT DESK AGENT
    // ========================================================

    const FrontDeskAgent = {

        async searchBookings({
            hotelId,
            guestName,
            room,
            status
        }) {

            const query = {
                hotelId
            };

            if (guestName) {

                query.name = {
                    $regex:
                        normalize(guestName),
                    $options: "i"
                };
            }

            if (room) {
                query.room =
                    normalize(room);
            }

            if (status) {
                query.gueststatus =
                    status;
            }


            return await Booking
                .find(query)
                .sort({
                    checkIn: 1
                })
                .limit(100)
                .lean();
        },


        async checkIn({
            hotelId,
            bookingId,
            user
        }) {

            const booking =
                await Booking.findOne({
                    _id: bookingId,
                    hotelId
                });

            if (!booking) {
                throw new Error(
                    "Booking not found."
                );
            }

            if (booking.gueststatus === "checkedin") {

                throw new Error(
                    "Guest is already checked in."
                );
            }

            if (
                booking.gueststatus === "cancelled" ||
                booking.gueststatus === "void"
            ) {

                throw new Error(
                    `Cannot check in a ${booking.gueststatus} booking.`
                );
            }


            booking.checkedIn =
                true;

            booking.gueststatus =
                "checkedin";

            booking.updatedBy =
                user || "AI Copilot";


            await booking.save();


            await audit({
                hotelId,
                user,
                action:
                    "AI_GUEST_CHECKED_IN",

                details: {
                    bookingId,
                    guest:
                        booking.name,

                    room:
                        booking.room
                }
            });


            return {

                success: true,

                bookingId,

                guest:
                    booking.name,

                room:
                    booking.room,

                status:
                    "checkedin",

                message:
                    `${booking.name} has been checked in.`
            };
        },


        async checkOut({
            hotelId,
            bookingId,
            user
        }) {

            const booking =
                await Booking.findOne({
                    _id: bookingId,
                    hotelId
                });

            if (!booking) {
                throw new Error(
                    "Booking not found."
                );
            }


            if (
                booking.gueststatus !==
                "checkedin"
            ) {

                throw new Error(
                    "Guest is not currently checked in."
                );
            }


            if (
                numberValue(
                    booking.balance
                ) > 0
            ) {

                throw new Error(
                    `Cannot check out guest. Outstanding booking balance is ${booking.balance}.`
                );
            }


            booking.checkedIn =
                false;

            booking.gueststatus =
                "checkedout";

            booking.updatedBy =
                user || "AI Copilot";


            await booking.save();


            await audit({
                hotelId,
                user,
                action:
                    "AI_GUEST_CHECKED_OUT",

                details: {
                    bookingId,
                    guest:
                        booking.name,

                    room:
                        booking.room
                }
            });


            return {

                success: true,

                bookingId,

                guest:
                    booking.name,

                room:
                    booking.room,

                status:
                    "checkedout",

                message:
                    `${booking.name} has been checked out successfully.`
            };
        }
    };


    // ========================================================
    // AUDIT AGENT
    // ========================================================

    const AuditAgent = {

        async search({
            hotelId,
            action,
            user,
            limit = 50
        }) {

            const query = {
                hotelId
            };

            if (action) {
                query.action = {
                    $regex:
                        normalize(action),
                    $options: "i"
                };
            }

            if (user) {
                query.user = {
                    $regex:
                        normalize(user),
                    $options: "i"
                };
            }


            return await AuditLog
                .find(query)
                .sort({
                    timestamp: -1
                })
                .limit(
                    Math.min(
                        numberValue(limit, 50),
                        200
                    )
                )
                .lean();
        }
    };


    // ========================================================
    // AGENT REGISTRY
    // ========================================================

    return {

        inventory: InventoryAgent,

        sales: SalesAgent,

        folio: FolioAgent,

        rooms: RoomAgent,

        kitchen: KitchenAgent,

        frontDesk:
            FrontDeskAgent,

        audit:
            AuditAgent
    };
}


module.exports = {
    createNovusAgents
};