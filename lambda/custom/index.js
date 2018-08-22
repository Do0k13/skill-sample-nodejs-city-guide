/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-use-before-define */


// City Guide: A sample Alexa Skill Lambda function
//  This function shows how you can manage data in objects and arrays,
//   choose a random recommendation,
//   call an external API and speak the result,
//   handle YES/NO intents with session attributes,
//   and return text data on a card.

const Alexa = require('ask-sdk-core');
//var Alexa = require('alexa-sdk');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const https = require('https');
//var http = require('http');


// 1. Handlers ===================================================================================

const LaunchHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        const speechOutput = `${requestAttributes.t('WELCOME')} ${requestAttributes.t('HELP')}`;
        return responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    },
};

const AboutHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AboutIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();

        return responseBuilder
            .speak(requestAttributes.t('ABOUT'))
            .getResponse();
    },
};

const CoffeeHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'CoffeeIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('coffee'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `Para una gran cafetería, yo recomiendo, ${restaurant.name}. ¿Quieres escuchar más al respecto?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const BreakfastHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'BreakfastIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('breakfast'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `Para el desayuno, intenta este, ${restaurant.name}. ¿Quieres escuchar más al respecto?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const LunchHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'LunchIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('lunch'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `¡Hora de la comida! Aquí está un buen lugar. ${restaurant.name}. ¿Quieres escuchar más al respecto?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const DinnerHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'DinnerIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurant = randomArrayElement(getRestaurantsByMeal('dinner'));
        sessionAttributes.restaurant = restaurant.name;
        const speechOutput = `Disfruta una cena en, ${restaurant.name}. ¿Queres escuchar más al respecto?`;

        return responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
    },
};

const YesHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const sessionAttributes = attributesManager.getSessionAttributes();
        const restaurantName = sessionAttributes.restaurant;
        const restaurantDetails = getRestaurantByName(restaurantName);
        const speechOutput = `${restaurantDetails.name
        } está ubicado en, ${restaurantDetails.address
        }, el número telefónico es, ${restaurantDetails.phone
        }, y su descripción es, ${restaurantDetails.description
        }  He enviado esos detalles a la aplicación Alexa en tu teléfono.  ¡Disfruta tu comida!
        <say-as interpret-as="interjection">bon appetit</say-as>`;

        const card = `${restaurantDetails.name}\n${restaurantDetails.address}\n$
        {data.city}, ${data.state} ${data.postcode}\nphone: ${restaurantDetails.phone}\n`;

        return responseBuilder
            .speak(speechOutput)
            .withSimpleCard(SKILL_NAME, card)
            .getResponse();
    },
};

const AttractionHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AttractionIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;

        let distance = 200;
        if (request.intent.slots.distance.value && request.intent.slots.distance.value !== "?") {
            distance = request.intent.slots.distance.value;
        }

        const attraction = randomArrayElement(getAttractionsByDistance(distance));

        const speechOutput = `Intenta ${
            attraction.name}, el cual es ${
            attraction.distance === '0' ? 'justo en el centro. ' : `${attraction.distance} kilómetros de aqui. ¡Diviértete! `
        }${attraction.description}`;

        return responseBuilder.speak(speechOutput).getResponse();
    },
};

const GoOutHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'GoOutIntent';
    },
    handle(handlerInput) {
        return new Promise((resolve) => {
            getWeather((localTime, currentTemp, currentCondition) => {
                const speechOutput = `son las ${localTime
                } y el clima en ${data.city
                } es ${
                    currentTemp} y ${currentCondition}`;
                resolve(handlerInput.responseBuilder.speak(speechOutput).getResponse());
            });
        });
    },
};

const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder
            .speak(requestAttributes.t('HELP'))
            .reprompt(requestAttributes.t('HELP'))
            .getResponse();
    },
};

const StopHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.NoIntent'
            || request.intent.name === 'AMAZON.CancelIntent'
            || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder
            .speak(requestAttributes.t('STOP'))
            .getResponse();
    },
};

const SessionEndedHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Sesión finalizada por la siguiente razón: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const request = handlerInput.requestEnvelope.request;

        console.log(`Manejo del error: ${error.message}`);
        console.log(` La solicitud original fué ${JSON.stringify(request, null, 2)}\n`);

        return handlerInput.responseBuilder
            .speak('Una disculpa, no puedo entender el comando. Por favor intenta nuevamente.')
            .reprompt('Una disculpa, no puedo entender el comando. Por favor dilo de nuevo.')
            .getResponse();
    },
};

const FallbackHandler = {

  // 2018-May-01: AMAZON.FallackIntent is only currently available in en-US locale.

  //              This handler will not be triggered except in that locale, so it can be

  //              safely deployed for any locale.

  canHandle(handlerInput) {

    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'

      && request.intent.name === 'AMAZON.FallbackIntent';

  },

  handle(handlerInput) {

    return handlerInput.responseBuilder

      .speak(FALLBACK_MESSAGE)

      .reprompt(FALLBACK_REPROMPT)

      .getResponse();

  },

};


// 2. Constants ==================================================================================

const languageStrings = {
    es  : {
        translation: {
            WELCOME: '¡Bienvenido a la guía de Tampico!',
            HELP: 'Menciona sobre lo que quieres saber de la ciudad, o menciona café, desayuno, comida o cena, para escuchar acerca de sugerencias de los restaurantes locales, o que recomiende una atracción, o menciona salir fuera. ',
            ABOUT: 'Tampico Tamaulipas es una ciudad en el golfo de México. Un popular destino turístico, Tampico tiene una rica historia como destino turístico, Tampico tiene una rica historia de pesca y transporte marítimo.',
            STOP: '¡Está bien, te veo la próxima!',
        },
    },
    // , 'de-DE': { 'translation' : { 'TITLE'   : "Local Helfer etc." } }
};
const data = {
    city: 'Tampico',
    state: 'TAMPS',
    postcode: '89000',
    restaurants: [
        {
            name: "Ocho Leguas",
            address: 'Avenida Hidalgo 122',
            phone: '3-77-88-44',
            meals: 'desayuno, comida',
            description: 'Un buen lugar para tomar el desayuno.  ¡Prueben su única hamburguesa!',
        },
        {
            name: 'Regio Burger',
            address: 'Laguna de la Puerta',
            phone: '3-45-76-32',
            meals: 'cena',
            description: 'Hamburguesas al carbón estilo monterrey.',
        },
        {
            name: "Cielo Rojo Café",
            address: 'Amplicación Unidad Nacional',
            phone: '6-86-34-98',
            meals: 'café, desayuno',
            description: 'Un excelente lugar para desayunar y tomar café.',
        },

    ],
    attractions: [
        {
            name: 'Mirador de Cocodrilos',
            description: 'Sitio en la LAguna del Carpintero para visitar d admirar grandes cocodrilos. ',
            distance: '0',
        },
        {
            name: 'Zona Centro Tampico',
            description: 'Zona centro de la ciudad, con variedad de tiendas y restaurantes para todos los gustos.',
            distance: '2',
        },
        {
            name: 'Centro Comercial Altama',
            description: 'Un lugar donde se encuentran las principales tiendas departamentales, ideal para pasar la tarde.',
            distance: '4',
        },
        {
            name: 'Playa Miramar',
            description: 'Playa en Ciudad Madero con diversas actividades y agradables restaurantes. ',
            distance: '6',
        },
    ],
};

const SKILL_NAME = 'Guia Tampico';
const FALLBACK_MESSAGE = `La ${SKILL_NAME} no puede ayudarte con eso.  Te puedo ayudar a conocer Tampico si tu me dices cuéntame de este lugar. ¿Cómo puedo ayudarte?`;
const FALLBACK_REPROMPT = '¿De qué forma puedo ayudarte?';



// 3. Helper Functions ==========================================================================


const myAPI = {
    host: 'query.yahooapis.com',
    port: 443,
    path: `/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${encodeURIComponent(data.city)}%2C%20${data.state}%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`,
    method: 'GET',
};

function getRestaurantsByMeal(mealType) {
    const list = [];
    for (let i = 0; i < data.restaurants.length; i += 1) {
        if (data.restaurants[i].meals.search(mealType) > -1) {
            list.push(data.restaurants[i]);
        }
    }
    return list;
}

function getRestaurantByName(restaurantName) {
    let restaurant = {};
    for (let i = 0; i < data.restaurants.length; i += 1) {
        if (data.restaurants[i].name === restaurantName) {
            restaurant = data.restaurants[i];
        }
    }
    return restaurant;
}

function getAttractionsByDistance(maxDistance) {
    const list = [];

    for (let i = 0; i < data.attractions.length; i += 1) {
        if (parseInt(data.attractions[i].distance, 10) <= maxDistance) {
            list.push(data.attractions[i]);
        }
    }
    return list;
}

function getWeather(callback) {
    const req = https.request(myAPI, (res) => {
        res.setEncoding('utf8');
        let returnData = '';

        res.on('data', (chunk) => {
            returnData += chunk;
        });
        res.on('end', () => {
            const channelObj = JSON.parse(returnData).query.results.channel;

            let localTime = channelObj.lastBuildDate.toString();
            localTime = localTime.substring(17, 25).trim();

            const currentTemp = channelObj.item.condition.temp;

            const currentCondition = channelObj.item.condition.text;

            callback(localTime, currentTemp, currentCondition);
        });
    });
    req.end();
}

function randomArrayElement(array) {
    let i = 0;
    i = Math.floor(Math.random() * array.length);
    return (array[i]);
}

const LocalizationInterceptor = {
    process(handlerInput) {
        const localizationClient = i18n.use(sprintf).init({
            lng: handlerInput.requestEnvelope.request.locale,
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings,
            returnObjects: true,
        });

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = function (...args) {
            return localizationClient.t(...args);
        };
    },
};

// 4. Export =====================================================================================

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchHandler,
        AboutHandler,
        CoffeeHandler,
        BreakfastHandler,
        LunchHandler,
        DinnerHandler,
        YesHandler,
        AttractionHandler,
        GoOutHandler,
        HelpHandler,
        StopHandler,
        FallbackHandler,
        SessionEndedHandler
    )
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .lambda();
