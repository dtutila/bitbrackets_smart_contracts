const leche = require('leche');
const withData = leche.withData;
const ContestPoolMock = artifacts.require("./mocks/ContestPoolMock.sol");
const {assertEvent, emptyCallback} = require("./utils/utils.js");
const { toBigNumberArray, assertBigNumberArrayIsEqual } = require('./utils/TestUtil');
const t = require('./utils/TestUtil').title;
const amount = require('./utils/AmountUtil').expected;
const Builder = require('./utils/ContestPoolBuilder');

/**
 * @author Guillermo Salazar
 */
contract('ContestPoolSendPredictionSetTest', accounts => {
    let contestPoolInstance;
    const owner = accounts[0];
    const manager = accounts[1];
    const player1 = accounts[2];
    const player2 = accounts[3];
    const player3 = accounts[4];
    const player4 = accounts[5];
    const player5 = accounts[6];
    const player6 = accounts[7];
    const player7 = accounts[8];
    const player8 = accounts[9];

    beforeEach('Deploying contract for each test', async () => {
        contestPoolInstance = await ContestPoolMock.new(
            owner,
            manager
        );
    });

    // _1_1Pre
    const _1_prediction1 = {player: player1, prediction: [10101010, 11010101]};
    const _2_prediction1 = {player: player1, prediction: [10101010, 11010101, 01010101]};
    const _3_prediction1 = {player: player1, prediction: [10101010]};
    withData({
        _1_with2Matches: [0.01, _1_prediction1],
        _2_with3Matches: [0.001, _2_prediction1],
        _3_with1Match: [0.001, _3_prediction1]
    }, function(amountInEther, prediction) {
        it(t('aPlayer', 'sendPredictionSet', 'Should be able to send a prediction.'), async function() {
            //Setup
            const amountPerPlayer = web3.toWei(amountInEther, 'ether');
            const builder = new Builder(contestPoolInstance);
            await builder.startTime(owner, 2018, 01, 5);
            await builder.endTime(owner, 2018, 01, 10);//5 days to wait for the match results.
            await builder.graceTimeDays(owner, 5);//5 days to publish your scores.
            await builder.amountPerPlayer(owner, amountPerPlayer);
            await builder.currentTime(owner, 2018, 01, 01);
            const initialContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()

            //Invocation
            await contestPoolInstance.sendPredictionSet(
                prediction.prediction,
                {from: prediction.player, value: amountPerPlayer}
            );

            //Assertions
            assertEvent(contestPoolInstance, {event: 'LogSendPrediction', args: {
                contractAddress: contestPoolInstance.address,
                player: prediction.player
            }}, 1, emptyCallback);

            const contractPrediction = await contestPoolInstance.getPredictionSet(prediction.player);
            const finalContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber();
    
            assertBigNumberArrayIsEqual(contractPrediction, toBigNumberArray(prediction.prediction));
            assert.equal(initialContractBalance + amountPerPlayer, finalContractBalance);
        });
    });

    const _1_prediction2 = {player: player2, prediction: [10101010, 11010101]};
    const _2_prediction2 = {player: player3, prediction: [10101010, 11010101, 01010101]};
    const _3_prediction2 = {player: player4, prediction: [10101010]};
    withData({
        _1_with2Matches: [0.01, _1_prediction2],
        _2_with3Matches: [0.001, _2_prediction2],
        _3_with1Match: [0.001, _3_prediction2]
    }, function(amountInEther, prediction) {
        it(t('aPlayer', 'sendPredictionSet', 'Should not be able to send a prediction twice.', true), async function() {
            //Setup
            const amountPerPlayer = web3.toWei(amountInEther, 'ether');
            const builder = new Builder(contestPoolInstance);
            await builder.startTime(owner, 2018, 01, 5);
            await builder.endTime(owner, 2018, 01, 10);//5 days to wait for the match results.
            await builder.graceTimeDays(owner, 5);//5 days to publish your scores.
            await builder.amountPerPlayer(owner, amountPerPlayer);
            await builder.currentTime(owner, 2018, 01, 01);
            const initialContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()

            //Invocation #1
            await contestPoolInstance.sendPredictionSet(
                prediction.prediction,
                {from: prediction.player, value: amountPerPlayer}
            );
            const finalContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber();

            //Invocation #2
            try {
                await contestPoolInstance.sendPredictionSet(
                    prediction.prediction,
                    {from: prediction.player, value: amountPerPlayer}
                );
                //Assertions
                assert(false, "Should have failed when trying to contribute two times.");
            } catch(error) {
                //Assertions
                assert(error);
                assert(error.message.includes("revert"));
                assert.equal(initialContractBalance + amountPerPlayer, finalContractBalance);
            }
        });
    });

    const _1_prediction3 = {player: player2, prediction: [10101010, 11010101]};
    const _2_prediction3 = {player: player3, prediction: [10101010, 11010101, 01010101]};
    const _3_prediction3 = {player: player4, prediction: [10101010]};
    withData({
        _1_with2Matches: [0.01, 0.011, _1_prediction3],
        _2_with3Matches: [0.001, 0.002, _2_prediction3],
        _3_with1Match: [0.001, 0.00100001, _3_prediction3]
    }, function(amountPerPlayerInEther, contributionAmountInEther, prediction) {
        it(t('aPlayer', 'sendPredictionSet', 'Should not be able to send contribution with value higher than max contribution.', true), async function() {
            //Setup
            const contributionAmountInWeis = web3.toWei(contributionAmountInEther, 'ether');
            const amountPerPlayerInWeis = web3.toWei(amountPerPlayerInEther, 'ether');
            const builder = new Builder(contestPoolInstance);
            await builder.startTime(owner, 2018, 01, 5);
            await builder.endTime(owner, 2018, 01, 10);//5 days to wait for the match results.
            await builder.graceTimeDays(owner, 5);//5 days to publish your scores.
            await builder.amountPerPlayer(owner, amountPerPlayerInWeis);
            await builder.currentTime(owner, 2018, 01, 01);
            const initialContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()

            //Invocation #2
            try {
                await contestPoolInstance.sendPredictionSet(
                    prediction.prediction,
                    {from: prediction.player, value: contributionAmountInWeis}
                );
                //Assertions
                assert(false, "Should have failed when trying to contribute more than high amount per player.");
            } catch(error) {
                const finalContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()
                //Assertions
                assert(error);
                assert(error.message.includes("revert"));
                assert.equal(initialContractBalance, finalContractBalance);
            }
        });
    });

    const _1_prediction4 = {player: player2, prediction: [10101010, 11010101]};
    const _2_prediction4 = {player: player3, prediction: [10101010, 11010101, 01010101]};
    const _3_prediction4 = {player: player4, prediction: [10101010]};
    withData({
        _1_with2Matches:    [1.00, 0.01, 1.001, _1_prediction4],
        _2_with3Matches:    [1.00, 0.02, 1.00000001, _2_prediction4],
        _3_with1Match:      [2.00, 0.03, 1.10000001, _3_prediction4]
    }, function(maxBalanceInEther, amountPerPlayerInEther, contributionAmountInEther, prediction) {
        it(t('aPlayer', 'sendPredictionSet', 'Should not be able to send contribution with value higher than max balance.', true), async function() {
            //Setup
            const builder = new Builder(contestPoolInstance);
            await builder.startTime(owner, 2018, 01, 5);
            await builder.endTime(owner, 2018, 01, 10);//5 days to wait for the match results.
            await builder.graceTimeDays(owner, 5);//5 days to publish your scores.
            await builder.amountPerPlayer(owner, web3.toWei(amountPerPlayerInEther, 'ether'));
            await builder.maxBalance(owner, web3.toWei(maxBalanceInEther, 'ether'));
            await builder.currentTime(owner, 2018, 01, 01);
            const initialContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()

            //Invocation
            try {
                await contestPoolInstance.sendPredictionSet(
                    prediction.prediction,
                    {from: prediction.player, value: web3.toWei(contributionAmountInEther, 'ether')}
                );
                //Assertions
                assert(false, "Should have failed when trying to contribute more than max balance.");
            } catch(error) {
                const finalContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()
                //Assertions
                assert(error);
                assert(error.message.includes("revert"));
                assert.equal(initialContractBalance, finalContractBalance);
            }
        });
    });

    const _1_prediction5 = {player: manager, prediction: [10101010, 11010101]};
    const _2_prediction5 = {player: owner, prediction: [10101010, 11010101, 01010101]};
    withData({
        _1_with2Matches:    ['aManager',    0.01, _1_prediction5],
        _2_with3Matches:    ['aOwner',      0.02, _2_prediction5]
    }, function(who, amountPerPlayerInEther, prediction) {
        it(t(who, 'sendPredictionSet', 'Should not be able to send contributions.', true), async function() {
            //Setup
            const builder = new Builder(contestPoolInstance);
            await builder.startTime(owner, 2018, 01, 5);
            await builder.endTime(owner, 2018, 01, 10);//5 days to wait for the match results.
            await builder.graceTimeDays(owner, 5);//5 days to publish your scores.
            await builder.amountPerPlayer(owner, web3.toWei(amountPerPlayerInEther, 'ether'));
            await builder.maxBalance(owner, web3.toWei(2.0, 'ether'));
            await builder.currentTime(owner, 2018, 01, 01);
            const initialContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()

            //Invocation
            try {
                await contestPoolInstance.sendPredictionSet(
                    prediction.prediction,
                    {from: prediction.player, value: web3.toWei(amountPerPlayerInEther, 'ether')}
                );
                //Assertions
                assert(false, "Should have failed when trying to contribute more than max balance.");
            } catch(error) {
                const finalContractBalance = web3.eth.getBalance(contestPoolInstance.address).toNumber()
                //Assertions
                assert(error);
                assert(error.message.includes("revert"));
                assert.equal(initialContractBalance, finalContractBalance);
            }
        });
    });

});
