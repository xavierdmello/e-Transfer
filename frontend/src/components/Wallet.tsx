import { useState } from "react";

import "../styles/wallet.css";

import SendMoney from "./SendMoney.tsx";
import History from "./History.tsx";

import { Button, Box, Flex, Spacer } from "@chakra-ui/react";

function Wallet() {
  const [page, setPage] = useState<string>("sendMoney");

  return (
    <Box backgroundColor={"white"} height={"100%"} borderRadius={"3xl"} overflow={"hidden"}>
      <Flex direction={"row"} className="walletHeader">
        <Button
          onClick={() => setPage("sendMoney")}
          width={"50%"}
          height={"50px"}
          borderRadius={"2xl"}
          borderBottomStartRadius={"0px"}
          backgroundColor={`${page === "sendMoney" ? "white" : "gray.100"}`}
          _hover={{ backgroundColor: `${page === "sendMoney" ? "white" : "gray.100"}` }}
        >
          Send Money
        </Button>
        <Button
          onClick={() => setPage("history")}
          width={"50%"}
          height={"50px"}
          borderRadius={"2xl"}
          borderBottomEndRadius={"0px"}
          backgroundColor={`${page === "history" ? "white" : "gray.100"}`}
          _hover={{ backgroundColor: `${page === "history" ? "white" : "gray.100"}` }}
        >
          History
        </Button>
      </Flex>

      <Spacer />

      {page === "sendMoney" ? <SendMoney /> : <History />}
    </Box>
  );
}

export default Wallet;
