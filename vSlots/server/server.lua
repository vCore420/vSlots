QBCore = exports['qb-core']:GetCoreObject()

-- Callback to get player's cash
QBCore.Functions.CreateCallback('vSlots:GetPlayerCash', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if Player then
        cb(Player.PlayerData.money['cash'] or 0)
    else
        cb(0)
    end
end)

-- Event to remove cash (bet)
RegisterNetEvent('vSlots:RemoveCash', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player and amount > 0 then
        Player.Functions.RemoveMoney('cash', amount)
    end
end)

-- Event to add cash (win)
RegisterNetEvent('vSlots:AddCash', function(amount)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if Player and amount > 0 then
        Player.Functions.AddMoney('cash', amount)
    end
end)