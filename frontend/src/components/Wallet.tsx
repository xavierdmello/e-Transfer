import { useState } from "react";

import "../styles/wallet.css";

import SendMoney from "./SendMoney.tsx";
import ReceiveMoney from "./ReceiveMoney.tsx";

import { Button, Box, Flex, Spacer } from "@chakra-ui/react";

function Wallet({ menu, setMenu }: { menu: string; setMenu: (arg0: string) => void }) {
  return (
    <Box backgroundColor={"white"} height={"100%"} borderRadius={"3xl"} overflow={"auto"}>
      <Flex direction={"row"} className="walletHeader">
        <Button
          onClick={() => setMenu("sendMoney")}
          width={"50%"}
          height={"50px"}
          borderRadius={"2xl"}
          borderBottomStartRadius={"0px"}
          backgroundColor={`${menu === "sendMoney" ? "white" : "gray.100"}`}
          _hover={{ backgroundColor: `${menu === "sendMoney" ? "white" : "gray.100"}` }}
        >
          Send Money
        </Button>
        <Button
          onClick={() => setMenu("receiveMoney")}
          width={"50%"}
          height={"50px"}
          borderRadius={"2xl"}
          borderBottomEndRadius={"0px"}
          backgroundColor={`${menu === "receiveMoney" ? "white" : "gray.100"}`}
          _hover={{ backgroundColor: `${menu === "receiveMoney" ? "white" : "gray.100"}` }}
        >
          Receive Money
        </Button>
      </Flex>
      <Spacer />
      {menu === "sendMoney" && <SendMoney />}
      {menu === "receiveMoney" && <ReceiveMoney />}
    </Box>
  );
}

export default Wallet;
