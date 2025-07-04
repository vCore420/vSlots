local QBCore = exports['qb-core']:GetCoreObject()
local slotOpen = false
local sitting = false
local attachedEntity = nil
local attachOffset = vector3(0.0, -0.8, 0.7) -- Adjust as needed for seat position
local attachRot = vector3(0.0, 0.0, 0.0)   -- Adjust as needed for seat rotation
local slotCam = nil

-- todo: 
-- add more models to the targetModel list
-- add sounds to machines that can be herd in game by players nearby

Citizen.CreateThread(function()
    exports['qb-target']:AddTargetModel({
        161343630, 654385216, -487222358, 207578973
    }, {
        options = {
            {
                icon = "fas fa-coins",
                label = "Play Slot Machine",
                action = function(entity)
                    openSlotMachine(entity)
                end,
            },
        },
        distance = 2.0
    })
end)

function CreateCamera(entity)
    if slotCam then
        DestroyCamera()
    end

    -- Camera offset relative to the slot machine prop
    local offset = vector3(-0.8, -1.5, 1.2) 
    local camCoords = GetOffsetFromEntityInWorldCoords(entity, offset.x, offset.y, offset.z)

    slotCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamCoord(slotCam, camCoords.x, camCoords.y, camCoords.z)

    -- Look at the slot machine seat 
    local lookAtOffset = vector3(0.0, 0.0, 0.8) 
    local lookAt = GetOffsetFromEntityInWorldCoords(entity, lookAtOffset.x, lookAtOffset.y, lookAtOffset.z)
    PointCamAtCoord(slotCam, lookAt.x, lookAt.y, lookAt.z)

    SetCamActive(slotCam, true)
    RenderScriptCams(true, true, 1000, true, true)
    SetCamFov(slotCam, 60.0)
end

function DestroyCamera()
    if slotCam then
        RenderScriptCams(false, true, 500, true, true)
        DestroyCam(slotCam, false)
        slotCam = nil
    end
end

function openSlotMachine(entity)
    local model = GetEntityModel(entity)
    
    for _, hash in ipairs({161343630, 654385216, -487222358, 207578973}) do
        if model == hash then
            print("This is a valid slot machine model!")
        end
    end

    if slotOpen then return end
    slotOpen = true

    CreateCamera(entity)
    Wait(500) 

    local ped = PlayerPedId()
    sitting = true
    attachedEntity = entity

    AttachEntityToEntity(ped, entity, 0, attachOffset.x, attachOffset.y, attachOffset.z, attachRot.x, attachRot.y, attachRot.z, false, false, false, false, 2, true)
    Wait(10) 
    TaskStartScenarioInPlace(ped, "PROP_HUMAN_SEAT_CHAIR", 0, true)

    Wait(2000)

    SetNuiFocus(true, true)
    SendNUIMessage({ action = "showSlot" })
    updateSlotUICash()
end

function closeSlotMachine()
    if not slotOpen then return end
    slotOpen = false

    local ped = PlayerPedId()
    if sitting then
        sitting = false
        ClearPedTasks(ped)
        DetachEntity(ped, true, true)
        attachedEntity = nil
    end

    SetNuiFocus(false, false)
    SendNUIMessage({ action = "hideSlot" })
    Wait(1000)
    DestroyCamera()
end

-- Listen for ESC key to close slot machine 
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        if slotOpen then
            DisableControlAction(0, 200, true) 
            if IsControlJustReleased(0, 200) then 
                closeSlotMachine()
            end
        else
            Citizen.Wait(500)
        end
    end
end)

RegisterNUICallback("closeSlot", function(_, cb)
    closeSlotMachine()
    cb("ok")
end)

RegisterNUICallback("spinSlot", function(data, cb)
    local bet = tonumber(data.bet) or 0
    QBCore.Functions.TriggerCallback('vSlots:GetPlayerCash', function(cash)
        if cash >= bet and bet > 0 then
            TriggerServerEvent('vSlots:RemoveCash', bet)
            cb({ success = true })
            updateSlotUICash()
        else
            cb({ success = false, error = "Not enough cash!" })
        end
    end)
end)

RegisterNUICallback("winSlot", function(data, cb)
    local amount = tonumber(data.amount) or 0
    if amount > 0 then
        TriggerServerEvent('vSlots:AddCash', amount)
        updateSlotUICash()
    end
    cb("ok")
end)

function updateSlotUICash()
    QBCore.Functions.TriggerCallback('vSlots:GetPlayerCash', function(cash)
        SendNUIMessage({ action = "updateCash", cash = cash })
    end)
end

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)
        if slotOpen then
            updateSlotUICash()
        else
            Citizen.Wait(2000)
        end
    end
end)
