import { jest } from '@jest/globals';

const makeBaseTwilioPayload = (overrides = {}) => ({
  ButtonText: 'Tengo dudas',
  ButtonPayload: 'btn_2afhoi',
  From: 'whatsapp:+5212227098506',
  OriginalRepliedMessageSid: 'MM691bc1f23e83bab82dbf8916d03e5ba2',
  Body: 'Tengo dudas',
  MessageType: 'button',
  MessageSid: 'SMcc3f3e81de3940c3e1cb1db66e9bc176',
  ...overrides,
});

const makeDb = () => {
  const inboundMessage = {
    id: 5000,
    update: jest.fn().mockResolvedValue(undefined),
  };

  const phoneRecord = {
    id: 123,
    phoneNumber: '+5212227098506',
    status: 'activo',
  };

  const respondedMessage = {
    id: 9000,
    twilioSid: 'MM691bc1f23e83bab82dbf8916d03e5ba2',
    sentAt: new Date(),
    campaignId: 77,
    templateId: 10,
    update: jest.fn().mockResolvedValue(undefined),
  };

  const db = {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(undefined),
      transaction: jest.fn(),
    },
    initialize: jest.fn().mockResolvedValue(undefined),
    PhoneNumbers: {
      findOne: jest.fn().mockResolvedValue(phoneRecord),
      create: jest.fn().mockResolvedValue(phoneRecord),
      update: jest.fn().mockResolvedValue([1]),
    },
    Messages: {
      create: jest
        .fn()
        .mockImplementation(async (payload) => {
          if (payload?.type === 'inbound') return inboundMessage;
          return { id: 9999 };
        }),
      findOne: jest.fn().mockResolvedValue(respondedMessage),
      update: jest.fn().mockResolvedValue([1]),
    },
    TemplateButtons: {
      findOne: jest.fn(),
    },
    SupportTicket: {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    Templates: {
      findOne: jest.fn().mockResolvedValue(null),
    },
    Campaigns: {
      findOne: jest.fn().mockResolvedValue(null),
    },
  };

  return { db, inboundMessage, phoneRecord, respondedMessage };
};

const makeLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

describe('handleMessageResponse', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const runCase = async ({
    name,
    payloadOverrides,
    arrange,
    assert,
  }) => {
    const { db, inboundMessage, phoneRecord, respondedMessage } = makeDb();
    const logger = makeLogger();

    const getSearchablePhoneNumbers = jest.fn().mockReturnValue(['+5212227098506']);
    const sendMessage = jest.fn();
    const sendFreeTextMessages = jest.fn();

    const templates = {
      automaticResponse: { text: 'ok' },
      requestSupportMessageResponse: { id: 'TEMPLATE_SUPPORT_CONFIRM' },
    };

    await jest.unstable_mockModule('../database/index.js', () => ({ default: db }));
    await jest.unstable_mockModule('../utils/logger.js', () => ({ default: logger }));
    await jest.unstable_mockModule('../utils/getSearchablePhoneNumbers.js', () => ({ default: getSearchablePhoneNumbers }));
    await jest.unstable_mockModule('../utils/twilio.js', () => ({ sendMessage, sendFreeTextMessages }));
    await jest.unstable_mockModule('../utils/messageTemplates.js', () => ({ templates }));
    await jest.unstable_mockModule('../config/redis.js', () => ({ default: {} }));

    if (arrange) await arrange({ db, inboundMessage, phoneRecord, respondedMessage, logger, sendMessage, sendFreeTextMessages });

    const { handleMessageResponse } = await import('../workers/webhookProcessor.js');

    const payload = makeBaseTwilioPayload(payloadOverrides);

    await handleMessageResponse(payload);

    if (assert) await assert({ db, inboundMessage, phoneRecord, respondedMessage, logger, sendMessage, sendFreeTextMessages });
  };

  const cases = [
    {
      name: '1) Respuesta button con payload + templateId resuelve por payload y guarda resolvedButtonId en inbound y respondedMessage',
      arrange: async ({ db }) => {
        db.TemplateButtons.findOne.mockResolvedValueOnce({ id: 444, label: 'Tengo dudas' });
      },
      assert: async ({ db, inboundMessage, respondedMessage }) => {
        expect(db.TemplateButtons.findOne).toHaveBeenCalledTimes(1);
        expect(inboundMessage.update).toHaveBeenCalledWith({ resolvedButtonId: 444 });
        expect(respondedMessage.update).toHaveBeenCalledWith({ resolvedButtonId: 444 });
      },
    },
    {
      name: '2) Payload no matchea pero ButtonText sí: resuelve por label',
      arrange: async ({ db }) => {
        db.TemplateButtons.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 445, label: 'Tengo dudas' });
      },
      assert: async ({ db, inboundMessage, respondedMessage }) => {
        expect(db.TemplateButtons.findOne).toHaveBeenCalledTimes(2);
        expect(inboundMessage.update).toHaveBeenCalledWith({ resolvedButtonId: 445 });
        expect(respondedMessage.update).toHaveBeenCalledWith({ resolvedButtonId: 445 });
      },
    },
    {
      name: '3) MessageType=text sin OriginalRepliedMessageSid: retorna temprano (no busca respondedMessage)',
      payloadOverrides: { MessageType: 'text', OriginalRepliedMessageSid: undefined, Body: 'hola' },
      assert: async ({ db }) => {
        expect(db.Messages.findOne).not.toHaveBeenCalled();
      },
    },
    {
      name: '4) Respuesta sin OriginalRepliedMessageSid: retorna temprano',
      payloadOverrides: { OriginalRepliedMessageSid: undefined, MessageType: 'button' },
      assert: async ({ db }) => {
        expect(db.Messages.findOne).not.toHaveBeenCalled();
      },
    },
    {
      name: '5) Mensaje original no existe: log error y retorna',
      arrange: async ({ db }) => {
        db.Messages.findOne.mockResolvedValueOnce(null);
      },
      assert: async ({ db, logger }) => {
        expect(db.Messages.findOne).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
      },
    },
    {
      name: '6) Mensaje original existe pero templateId null: no resuelve botón, no guarda resolvedButtonId',
      arrange: async ({ respondedMessage }) => {
        respondedMessage.templateId = null;
      },
      assert: async ({ db, inboundMessage, respondedMessage }) => {
        expect(db.TemplateButtons.findOne).not.toHaveBeenCalled();
        expect(inboundMessage.update).not.toHaveBeenCalledWith(expect.objectContaining({ resolvedButtonId: expect.anything() }));
        expect(respondedMessage.update).not.toHaveBeenCalledWith(expect.objectContaining({ resolvedButtonId: expect.anything() }));
      },
    },
    {
      name: '7) Payload vacío: intenta por label si existe',
      payloadOverrides: { ButtonPayload: '   ' },
      arrange: async ({ db }) => {
        db.TemplateButtons.findOne.mockResolvedValueOnce({ id: 446, label: 'Tengo dudas' });
      },
      assert: async ({ db }) => {
        expect(db.TemplateButtons.findOne).toHaveBeenCalledTimes(1);
      },
    },
    {
      name: '8) ButtonText vacío: no resuelve por label',
      payloadOverrides: { ButtonText: '   ', Body: '   ' },
      arrange: async ({ db }) => {
        db.TemplateButtons.findOne.mockResolvedValueOnce(null);
      },
      assert: async ({ db }) => {
        expect(db.TemplateButtons.findOne).toHaveBeenCalledTimes(1);
      },
    },
    {
      name: '9) Si resuelve botón, actualiza campaignId en inbound si currentCampaignId existe',
      arrange: async ({ db }) => {
        db.TemplateButtons.findOne.mockResolvedValueOnce({ id: 447, label: 'Tengo dudas' });
      },
      assert: async ({ inboundMessage }) => {
        expect(inboundMessage.update).toHaveBeenCalledWith({ campaignId: 77 });
      },
    },
    {
      name: '10) Si currentCampaignId es null, no intenta setear campaignId al inbound',
      arrange: async ({ respondedMessage, db }) => {
        respondedMessage.campaignId = null;
        db.TemplateButtons.findOne.mockResolvedValueOnce({ id: 448, label: 'Tengo dudas' });
      },
      assert: async ({ inboundMessage }) => {
        expect(inboundMessage.update).not.toHaveBeenCalledWith({ campaignId: null });
      },
    },
    {
      name: '11) Mensaje antiguo (>1 día): busca último initial no respondido',
      arrange: async ({ respondedMessage, db }) => {
        respondedMessage.sentAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        db.Messages.findOne
          .mockResolvedValueOnce(respondedMessage)
          .mockResolvedValueOnce({
            ...respondedMessage,
            id: 9001,
            twilioSid: 'MM_NEW',
            templateId: 10,
            sentAt: new Date(),
            update: jest.fn().mockResolvedValue(undefined),
          });
        db.TemplateButtons.findOne.mockResolvedValueOnce({ id: 449, label: 'Tengo dudas' });
      },
      assert: async ({ db }) => {
        expect(db.Messages.findOne).toHaveBeenCalledTimes(2);
      },
    },
    {
      name: '12) PhoneNumber no existe: crea el phoneRecord',
      arrange: async ({ db }) => {
        db.PhoneNumbers.findOne.mockResolvedValueOnce(null);
      },
      assert: async ({ db }) => {
        expect(db.PhoneNumbers.create).toHaveBeenCalled();
      },
    },
    {
      name: '13) Guarda siempre inboundMessage al inicio',
      assert: async ({ db }) => {
        expect(db.Messages.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'inbound' }));
      },
    },
    {
      name: '14) Actualiza respondedMessage.responseReceived/respondedAt siempre que encuentre respondedMessage',
      assert: async ({ respondedMessage }) => {
        expect(respondedMessage.update).toHaveBeenCalledWith(expect.objectContaining({ responseReceived: 'Tengo dudas' }));
      },
    },
    {
      name: '15) Si TemplateButtons.findOne lanza error: no truena toda la función (se loggea)',
      arrange: async ({ db }) => {
        db.TemplateButtons.findOne.mockRejectedValueOnce(new Error('db fail'));
      },
      assert: async ({ logger }) => {
        expect(logger.error).toHaveBeenCalled();
      },
    },
    {
      name: '16) Si inboundMessage.update falla al guardar resolvedButtonId: se loggea error y continúa',
      arrange: async ({ db, inboundMessage }) => {
        db.TemplateButtons.findOne.mockResolvedValueOnce({ id: 450, label: 'Tengo dudas' });
        inboundMessage.update.mockRejectedValueOnce(new Error('update fail'));
      },
      assert: async ({ logger }) => {
        expect(logger.error).toHaveBeenCalled();
      },
    },
    {
      name: '17) Si respondedMessage.update falla al guardar resolvedButtonId: se loggea error y continúa',
      arrange: async ({ db, respondedMessage }) => {
        db.TemplateButtons.findOne.mockResolvedValueOnce({ id: 451, label: 'Tengo dudas' });
        respondedMessage.update
          .mockResolvedValueOnce(undefined) // responseReceived update
          .mockRejectedValueOnce(new Error('update fail')); // resolvedButtonId update
      },
      assert: async ({ logger }) => {
        expect(logger.error).toHaveBeenCalled();
      },
    },
    {
      name: '18) Si Body existe pero ButtonText no: finalResponseText usa Body',
      payloadOverrides: { ButtonText: undefined, Body: 'texto normal', MessageType: 'button' },
      arrange: async ({ db }) => {
        db.TemplateButtons.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      },
      assert: async ({ respondedMessage }) => {
        expect(respondedMessage.update).toHaveBeenCalledWith(expect.objectContaining({ responseReceived: 'texto normal' }));
      },
    },
    {
      name: '19) Si MessageType=text con texto de promoción: envía free text y registra message',
      payloadOverrides: {
        MessageType: 'text',
        OriginalRepliedMessageSid: undefined,
        Body: 'Estoy realizando mi cambio a movistar y quiero la promoción',
        ButtonText: undefined,
      },
      arrange: async ({ sendFreeTextMessages }) => {
        sendFreeTextMessages.mockResolvedValue({ sid: 'SM_FREE' });
      },
      assert: async ({ sendFreeTextMessages, db }) => {
        expect(sendFreeTextMessages).toHaveBeenCalled();
        expect(db.Messages.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'free_text_response' }));
      },
    },
    {
      name: '20) Si MessageType=text no promoción: retorna sin enviar nada',
      payloadOverrides: { MessageType: 'text', OriginalRepliedMessageSid: undefined, Body: 'hola', ButtonText: undefined },
      assert: async ({ sendFreeTextMessages }) => {
        expect(sendFreeTextMessages).not.toHaveBeenCalled();
      },
    },
  ];

  test.each(cases)('$name', async (c) => {
    await runCase(c);
  });
});
